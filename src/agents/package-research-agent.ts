import { Agent } from "agents";
import type { Env } from "../shared";
import {
  createLogger,
  generateTraceId,
  generateRequestId,
  type Logger,
} from "../logger";
import { PackageResearchService } from "../services/package-research";

/**
 * Package Research Agent - Specialized for gathering package information
 */
export class PackageResearchAgent extends Agent<Env> {
  private logger: Logger;
  private packageResearchService: PackageResearchService;

  constructor(state: any, env: Env) {
    super(state, env);
    this.logger = createLogger(env, "PackageResearchAgent");
    this.packageResearchService = new PackageResearchService(env);
  }

  async onRequest(request: Request) {
    const traceId = generateTraceId();
    const requestId = generateRequestId();
    const logger = this.logger.withTracing(traceId, requestId);

    try {
      const body = (await request.json()) as {
        package_name?: string;
        package_names?: string[];
      };
      const { package_name, package_names } = body;

      if (!package_name && !package_names) {
        logger.warn("Missing package_name or package_names in request");
        return Response.json(
          { error: "package_name or package_names is required" },
          { status: 400 }
        );
      }

      logger.info("Research request received", {
        package_name,
        package_count: package_names?.length,
      });

      if (package_names) {
        // Research multiple packages
        const research =
          await this.packageResearchService.researchMultiplePackages(
            package_names,
            logger
          );
        return Response.json({
          packages: Object.fromEntries(research),
          count: research.size,
        });
      }

      // Research single package
      const research = await this.packageResearchService.researchPackage(
        package_name!,
        logger
      );
      return Response.json({
        package: package_name,
        research,
        analysis: this.packageResearchService.generatePackageAnalysis(research),
      });
    } catch (error) {
      logger.error("Package research failed", error as Error);
      return Response.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      );
    }
  }
}
