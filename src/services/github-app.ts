import { App, Octokit } from "octokit";
import type { Env } from "../shared";
import { createLogger } from "../logger";

export interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  webhookSecret: string;
  clientId?: string;
  clientSecret?: string;
  enterpriseHost?: string;
}

export class GitHubAppService {
  private app: App;
  private config: GitHubAppConfig;
  private logger: ReturnType<typeof createLogger>;

  constructor(config: GitHubAppConfig, env: Env) {
    this.config = config;
    this.logger = createLogger(env, "GitHubAppService");
    
    // Initialize Octokit App with proper configuration
    const appConfig: any = {
      appId: config.appId,
      privateKey: config.privateKey,
      webhooks: {
        secret: config.webhookSecret,
      },
    };

    // Add GitHub Enterprise support if needed
    if (config.enterpriseHost || env.GITHUB_ENTERPRISE_HOST) {
      const baseUrl = `https://${config.enterpriseHost || env.GITHUB_ENTERPRISE_HOST}/api/v3`;
      appConfig.Octokit = Octokit.defaults({
        baseUrl,
      });
    }

    this.app = new App(appConfig);
    this.setupWebhookHandlers();
  }

  /**
   * Get authenticated Octokit instance for a specific installation
   */
  async getInstallationOctokit(installationId: number) {
    try {
      const octokit = await this.app.getInstallationOctokit(installationId);
      this.logger.debug("Created installation Octokit client", { installationId });
      return octokit;
    } catch (error) {
      this.logger.error("Failed to create installation Octokit", error as Error, {
        installationId,
      });
      throw error;
    }
  }

  /**
   * Get app-level Octokit instance (for app management operations)
   */
  getAppOctokit() {
    return this.app.octokit;
  }

  /**
   * Get installation ID from repository
   */
  async getInstallationId(owner: string, repo: string): Promise<number | null> {
    try {
      const response = await this.app.octokit.request(
        "GET /repos/{owner}/{repo}/installation",
        {
          owner,
          repo,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );
      return response.data.id;
    } catch (error: any) {
      if (error.status === 404) {
        this.logger.warn("App not installed on repository", { owner, repo });
        return null;
      }
      this.logger.error("Failed to get installation ID", error, { owner, repo });
      throw error;
    }
  }

  /**
   * Setup webhook event handlers
   */
  private setupWebhookHandlers() {
    // Handle pull request events
    this.app.webhooks.on("pull_request.opened", this.handlePullRequestOpened.bind(this));
    this.app.webhooks.on("pull_request.synchronize", this.handlePullRequestUpdated.bind(this));
    
    // Handle push events (for requirements.txt changes)
    this.app.webhooks.on("push", this.handlePushEvent.bind(this));
    
    // Handle installation events
    this.app.webhooks.on("installation.created", this.handleInstallationCreated.bind(this));
    this.app.webhooks.on("installation.deleted", this.handleInstallationDeleted.bind(this));
    
    // Handle errors
    this.app.webhooks.onError((error) => {
      if (error.name === "AggregateError") {
        this.logger.error(`Webhook error processing request: ${error.event}`);
      } else {
        this.logger.error("Webhook error", error);
      }
    });
  }

  /**
   * Handle new pull request
   */
  private async handlePullRequestOpened({ octokit, payload }: any) {
    this.logger.info("Handling pull request opened", {
      pullRequest: payload.pull_request.number,
      repository: payload.repository.full_name,
    });

    try {
      // Check if PR contains requirements.txt changes
      const files = await this.getPullRequestFiles(octokit, payload);
      const requirementsFiles = files.filter(file => 
        file.filename.includes("requirements") && file.filename.endsWith(".txt")
      );

      if (requirementsFiles.length > 0) {
        await this.analyzeDependencyChanges(octokit, payload, requirementsFiles);
      }
    } catch (error) {
      this.logger.error("Error handling pull request opened", error as Error, {
        pullRequest: payload.pull_request.number,
      });
    }
  }

  /**
   * Handle pull request updates
   */
  private async handlePullRequestUpdated({ octokit, payload }: any) {
    this.logger.info("Handling pull request updated", {
      pullRequest: payload.pull_request.number,
      repository: payload.repository.full_name,
    });

    // Similar logic to handlePullRequestOpened
    await this.handlePullRequestOpened({ octokit, payload });
  }

  /**
   * Handle push events (for requirements.txt monitoring)
   */
  private async handlePushEvent({ octokit, payload }: any) {
    this.logger.info("Handling push event", {
      repository: payload.repository.full_name,
      ref: payload.ref,
      commits: payload.commits.length,
    });

    // Check if push contains requirements.txt changes
    const hasRequirementsChanges = payload.commits.some((commit: any) =>
      commit.added.some((file: string) => file.includes("requirements") && file.endsWith(".txt")) ||
      commit.modified.some((file: string) => file.includes("requirements") && file.endsWith(".txt"))
    );

    if (hasRequirementsChanges && payload.ref === `refs/heads/${payload.repository.default_branch}`) {
      await this.createDependencyHealthReport(octokit, payload);
    }
  }

  /**
   * Handle app installation
   */
  private async handleInstallationCreated({ payload }: any) {
    this.logger.info("App installed", {
      installation: payload.installation.id,
      account: payload.installation.account.login,
      repositories: payload.repositories?.length || "all",
    });

    // Optional: Send welcome issue or setup instructions
    if (payload.repositories) {
      for (const repo of payload.repositories) {
        await this.createWelcomeIssue(payload.installation.id, repo);
      }
    }
  }

  /**
   * Handle app uninstallation
   */
  private async handleInstallationDeleted({ payload }: any) {
    this.logger.info("App uninstalled", {
      installation: payload.installation.id,
      account: payload.installation.account.login,
    });
  }

  /**
   * Get files changed in a pull request
   */
  private async getPullRequestFiles(octokit: any, payload: any) {
    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
      {
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        pull_number: payload.pull_request.number,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    return response.data;
  }

  /**
   * Analyze dependency changes in PR
   */
  private async analyzeDependencyChanges(octokit: any, payload: any, requirementsFiles: any[]) {
    this.logger.info("Analyzing dependency changes", {
      files: requirementsFiles.map((f: any) => f.filename),
    });

    for (const file: any of requirementsFiles) {
      if (file.status === "modified" || file.status === "added") {
        // Parse the requirements from the file patch
        const newRequirements = this.parseRequirementsFromPatch(file.patch);
        
        if (newRequirements.length > 0) {
          // Trigger dependency analysis
          await this.runDependencyAnalysis(octokit, payload, newRequirements, file.filename);
        }
      }
    }
  }

  /**
   * Parse requirements from Git patch
   */
  private parseRequirementsFromPatch(patch: string): string[] {
    const addedLines = patch
      .split('\n')
      .filter(line => line.startsWith('+') && !line.startsWith('+++'))
      .map(line => line.substring(1).trim())
      .filter(line => line && !line.startsWith('#'));
    
    return addedLines;
  }

  /**
   * Run dependency analysis and post results
   */
  private async runDependencyAnalysis(
    octokit: any, 
    payload: any, 
    requirements: string[], 
    filename: string
  ) {
    try {
      // Call your existing dependency resolution API
      const analysisRequest = {
        requirements: requirements.map(req => ({ 
          name: req.split(/[>=<!=]/)[0].trim(),
          original_spec: req
        })),
        python_version: "3.9", // Could be detected from project
        allow_prereleases: false,
        exclude_deprecated: true,
      };

      // This would call your existing dependency resolver
      const response = await fetch(`${process.env.BASE_URL}/agents/dependency-resolver-agent/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisRequest),
      });

      const resolveData = (await response.json()) as { id: string };
      
      // Poll for results (simplified for example)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const statusResponse = await fetch(
        `${process.env.BASE_URL}/agents/dependency-resolver-agent/status?id=${resolveData.id}`
      );
      const result = (await statusResponse.json()) as { result: any };

      // Post analysis results as PR comment
      await this.postAnalysisComment(octokit, payload, result.result, filename);
      
    } catch (error) {
      this.logger.error("Failed to run dependency analysis", error as Error);
      
      // Post error comment
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        issue_number: payload.pull_request.number,
        body: `## 🔍 Dependency Analysis Failed\n\n❌ Failed to analyze dependencies in \`${filename}\`. Please check the file format and try again.`,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
    }
  }

  /**
   * Post analysis results as PR comment
   */
  private async postAnalysisComment(octokit: any, payload: any, analysis: any, filename: string) {
    const { resolved_packages = [], deprecated_packages = [], conflicts = [], warnings = [] } = analysis;
    
    let comment = `## 🔍 Dependency Analysis for \`${filename}\`\n\n`;
    
    if (analysis.success) {
      comment += `✅ **Analysis completed successfully**\n\n`;
      
      if (resolved_packages.length > 0) {
        comment += `### 📦 Resolved Packages (${resolved_packages.length})\n`;
        resolved_packages.slice(0, 10).forEach((pkg: any) => {
          comment += `- **${pkg.name}** → \`${pkg.version}\`\n`;
        });
        if (resolved_packages.length > 10) {
          comment += `- ... and ${resolved_packages.length - 10} more\n`;
        }
        comment += '\n';
      }
      
      if (deprecated_packages?.length > 0) {
        comment += `### ⚠️ Deprecated Packages (${deprecated_packages.length})\n`;
        deprecated_packages.forEach((pkg: any) => {
          comment += `- **${pkg.name}** \`${pkg.version}\`\n`;
          comment += `  - Reason: ${pkg.reason}\n`;
          if (pkg.suggested_alternative) {
            comment += `  - 💡 Consider: \`${pkg.suggested_alternative}\`\n`;
          }
        });
        comment += '\n';
      }
      
      if (conflicts?.length > 0) {
        comment += `### ❌ Conflicts (${conflicts.length})\n`;
        conflicts.forEach((conflict: any) => {
          comment += `- **${conflict.packages.join(', ')}**: ${conflict.reason}\n`;
          if (conflict.suggested_resolution) {
            comment += `  - 💡 ${conflict.suggested_resolution}\n`;
          }
        });
        comment += '\n';
      }
      
      if (warnings?.length > 0) {
        comment += `### ⚠️ Warnings\n`;
        warnings.forEach((warning: string) => {
          comment += `- ${warning}\n`;
        });
        comment += '\n';
      }
    } else {
      comment += `❌ **Analysis failed**: ${analysis.error}\n\n`;
    }
    
    comment += `---\n*Powered by [Python Dependency Resolver](${process.env.BASE_URL})*`;
    
    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.pull_request.number,
      body: comment,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  }

  /**
   * Create dependency health report for main branch
   */
  private async createDependencyHealthReport(octokit: any, payload: any) {
    // Implementation for main branch health reports
    this.logger.info("Creating dependency health report", {
      repository: payload.repository.full_name,
    });
  }

  /**
   * Create welcome issue for new installations
   */
  private async createWelcomeIssue(installationId: number, repo: any) {
    try {
      const octokit = await this.getInstallationOctokit(installationId);
      
      const welcomeBody = `# Welcome to Python Dependency Resolver! 🐍

Thank you for installing our AI-powered dependency analysis tool!

## What happens next?

This app will automatically:
- ✅ Analyze \`requirements.txt\` changes in pull requests
- ⚠️ Detect deprecated packages and suggest alternatives
- 🔍 Identify version conflicts and compatibility issues
- 📊 Provide detailed dependency health reports

## Getting started

1. Create or update a \`requirements.txt\` file
2. Open a pull request with dependency changes
3. Watch for our automated analysis comments!

## Need help?

- 📖 [Documentation](${process.env.BASE_URL})
- 🐛 [Report issues](https://github.com/your-repo/issues)
- 💬 [Get support](https://github.com/your-repo/discussions)

Happy coding! 🚀`;

      await octokit.request("POST /repos/{owner}/{repo}/issues", {
        owner: repo.owner.login,
        repo: repo.name,
        title: "🐍 Python Dependency Resolver - Welcome & Setup Guide",
        body: welcomeBody,
        labels: ["enhancement", "python-dependencies"],
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      this.logger.info("Created welcome issue", {
        repository: repo.full_name,
      });
    } catch (error) {
      this.logger.error("Failed to create welcome issue", error as Error, {
        repository: repo.full_name,
      });
    }
  }

  /**
   * Verify and handle webhook requests (for Cloudflare Workers)
   */
  async verifyAndReceiveWebhook(request: Request): Promise<Response> {
    try {
      const id = request.headers.get("x-github-delivery");
      const name = request.headers.get("x-github-event");
      const signature = request.headers.get("x-hub-signature-256");
      const payload = await request.text();

      if (!id || !name || !signature) {
        return new Response("Missing required headers", { status: 400 });
      }

      await this.app.webhooks.verifyAndReceive({
        id,
        name,
        signature,
        payload,
      });

      return new Response("OK", { status: 200 });
    } catch (error) {
      this.logger.error("Webhook verification failed", error as Error);
      return new Response("Unauthorized", { status: 401 });
    }
  }

  /**
   * Get the App instance for advanced usage
   */
  getApp() {
    return this.app;
  }
}

// Export configuration helper
export function getGitHubAppConfig(env: Env): GitHubAppConfig | null {
  const appId = env.GITHUB_APP_ID;
  const privateKey = env.GITHUB_PRIVATE_KEY;
  const webhookSecret = env.GITHUB_WEBHOOK_SECRET;

  if (!appId || !privateKey || !webhookSecret) {
    return null;
  }

  return {
    appId,
    privateKey,
    webhookSecret,
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    enterpriseHost: env.GITHUB_ENTERPRISE_HOST,
  };
} 