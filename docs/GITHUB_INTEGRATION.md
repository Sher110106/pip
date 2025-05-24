# GitHub Integration Guide

This guide covers the GitHub App integration for automated dependency analysis in pull requests.

## 🔍 Overview

The GitHub integration provides automated dependency analysis for Python projects. When enabled, it:

- **Analyzes Pull Requests**: Automatically scans `requirements.txt` changes
- **Posts Comments**: Adds detailed analysis comments to PRs
- **Status Checks**: Provides dependency health status
- **Security Alerts**: Highlights deprecated and vulnerable packages
- **Alternative Suggestions**: Recommends modern package alternatives

## 🏗️ Architecture

### GitHub App Flow

```mermaid
graph TD
    A[PR Created/Updated] --> B[GitHub Webhook]
    B --> C[Dependency Resolver Worker]
    C --> D[File Analysis Agent]
    D --> E[Package Research Agent]
    E --> F[Report Generator Agent]
    F --> G[GitHub Comment API]
    G --> H[PR Comment Posted]
```

### Components

1. **GitHub App**: OAuth app with repository permissions
2. **Webhook Handler**: Processes GitHub events
3. **File Analysis**: Detects `requirements.txt` changes
4. **Dependency Analysis**: AI-powered package analysis
5. **Comment Generation**: Formatted analysis reports

## 🚀 Setup Process

### 1. Create GitHub App

#### Automated Setup (Recommended)

Use the provided setup script:

```bash
chmod +x scripts/setup-github-integration.sh
./scripts/setup-github-integration.sh
```

The script will:
- Guide you through GitHub App creation
- Generate webhook secrets
- Configure environment variables
- Set up GitHub Actions workflows

#### Manual Setup

1. **Navigate to GitHub App Settings**:
   - Go to `https://github.com/settings/apps`
   - Click "New GitHub App"

2. **Basic Information**:
   ```
   GitHub App name: Python Dependency Analyzer
   Description: AI-powered Python dependency analysis for pull requests
   Homepage URL: https://your-worker.workers.dev
   Webhook URL: https://your-worker.workers.dev/api/webhooks/github
   ```

3. **Permissions**:
   ```
   Repository permissions:
   - Contents: Read
   - Issues: Write
   - Pull requests: Write
   - Checks: Write (optional)
   
   Organization permissions:
   - Members: Read (if needed)
   
   Subscribe to events:
   - Pull request
   - Push (optional)
   ```

4. **Generate Private Key**:
   - Click "Generate a private key"
   - Download the `.pem` file
   - Store securely

### 2. Configure Environment Variables

Set the following secrets in your Worker:

```bash
# Required GitHub App Configuration
npx wrangler secret put GITHUB_APP_ID --env production
npx wrangler secret put GITHUB_PRIVATE_KEY --env production
npx wrangler secret put GITHUB_WEBHOOK_SECRET --env production

# Optional Configuration
npx wrangler secret put GITHUB_CLIENT_ID --env production
npx wrangler secret put GITHUB_CLIENT_SECRET --env production
```

#### GitHub App Settings

```bash
# Get from GitHub App settings page
GITHUB_APP_ID=123456

# Generate a random webhook secret
GITHUB_WEBHOOK_SECRET=$(openssl rand -hex 32)

# Copy the contents of the downloaded private key file
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----"
```

### 3. Install GitHub App

1. **Go to App Installation**:
   - Navigate to `https://github.com/apps/your-app-name`
   - Click "Install"

2. **Choose Installation Scope**:
   - Select specific repositories or all repositories
   - Grant required permissions

3. **Configure Repository Access**:
   - Choose which repositories should have dependency analysis
   - Can be modified later in GitHub settings

## 🔧 Configuration Options

### Webhook Events

The integration responds to these GitHub events:

- **`pull_request`**: PR opened, updated, synchronized
- **`push`**: Changes to default branch (optional)
- **`installation`**: App installed/uninstalled
- **`installation_repositories`**: Repository access changed

### Analysis Triggers

Dependency analysis is triggered when:

1. **Requirements Files Changed**:
   - `requirements.txt`
   - `requirements/*.txt`
   - `dev-requirements.txt`
   - `test-requirements.txt`

2. **PR Events**:
   - Pull request opened
   - Pull request synchronized (new commits)
   - Pull request reopened

3. **Manual Triggers**:
   - Comment `/analyze-dependencies`
   - Re-request checks

### Customization

Configure analysis behavior via `.dependency-analyzer.yml` in repository root:

```yaml
# .dependency-analyzer.yml
python_versions:
  - "3.9"
  - "3.10"
  - "3.11"

exclude_deprecated: true
suggest_alternatives: true
include_security_analysis: true

# File patterns to analyze
requirements_files:
  - "requirements.txt"
  - "requirements/*.txt"
  - "*-requirements.txt"

# Skip analysis for certain PRs
skip_analysis:
  - draft_prs: false
  - automated_prs: true  # Skip PRs from bots
  - branch_patterns:
      - "dependabot/*"
      - "renovate/*"

# Comment settings
comment_settings:
  update_existing: true  # Update existing comments
  collapse_unchanged: true  # Collapse unchanged sections
  include_summary: true
  include_details: true
```

## 📝 Analysis Features

### Dependency Analysis

The system performs comprehensive analysis:

1. **Version Resolution**:
   - Resolves compatible versions
   - Checks Python version compatibility
   - Identifies version conflicts

2. **Deprecation Detection**:
   - Scans for deprecated packages
   - Suggests modern alternatives
   - Provides migration guidance

3. **Security Analysis**:
   - Identifies known vulnerabilities
   - Checks package maintenance status
   - Suggests security updates

4. **Performance Impact**:
   - Estimates bundle size changes
   - Analyzes dependency tree depth
   - Identifies heavy dependencies

### Comment Format

Generated comments include:

```markdown
## 🐍 Python Dependency Analysis

### Summary
- ✅ 8 packages resolved successfully
- ⚠️ 2 deprecated packages found
- 🔒 1 security advisory

### Changes Detected
#### Added Dependencies
- `numpy==1.21.0` ✅ Current, well-maintained
- `pandas==1.3.3` ✅ Current, well-maintained

#### Updated Dependencies
- `requests: 2.25.0 → 2.28.1` ✅ Security update recommended

#### Deprecated Packages
- `fabric==1.14.0` ⚠️ **DEPRECATED**
  - **Alternative**: `fabric2` or `invoke`
  - **Migration Guide**: [Link to migration docs]

### Security Notes
- `requests<2.28.0` has known vulnerability CVE-2022-3171
- Consider upgrading to `requests>=2.28.1`

### Generated Requirements
<details>
<summary>Click to view complete requirements.txt</summary>

```txt
# Generated by Python Dependency Analyzer
# Python 3.9 compatible

numpy==1.21.0
pandas==1.3.3
requests==2.28.1
# ... other packages
```
</details>
```

## 🔄 Workflow Integration

### GitHub Actions

Create `.github/workflows/dependency-check.yml`:

```yaml
name: Dependency Analysis

on:
  pull_request:
    paths:
      - 'requirements*.txt'
      - '**/requirements*.txt'

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Trigger Dependency Analysis
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.GITHUB_TOKEN }}" \
            -H "Accept: application/vnd.github.v3+json" \
            https://api.github.com/repos/${{ github.repository }}/dispatches \
            -d '{"event_type":"dependency-analysis","client_payload":{"pr_number":"${{ github.event.number }}"}}'
```

### Status Checks

Enable status checks in branch protection:

1. **Go to Repository Settings**:
   - Navigate to `Settings > Branches`
   - Edit branch protection rule

2. **Add Status Checks**:
   - Enable "Require status checks"
   - Add "dependency-analysis/status"
   - Add "dependency-analysis/security"

3. **Configure Rules**:
   ```
   ✅ dependency-analysis/status
   ✅ dependency-analysis/security
   ⚠️ dependency-analysis/deprecated (optional)
   ```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Webhook Not Received

**Symptoms**: No analysis comments on PRs

**Solutions**:
```bash
# Check webhook delivery in GitHub App settings
# Verify webhook URL is accessible
curl https://your-worker.workers.dev/api/webhooks/github

# Check Worker logs
npx wrangler tail --env production --search "webhook"
```

#### 2. Authentication Errors

**Symptoms**: "Authentication failed" in logs

**Solutions**:
```bash
# Verify GitHub App ID
npx wrangler secret put GITHUB_APP_ID --env production

# Check private key format (must include newlines)
npx wrangler secret put GITHUB_PRIVATE_KEY --env production

# Verify webhook secret
npx wrangler secret put GITHUB_WEBHOOK_SECRET --env production
```

#### 3. Permission Denied

**Symptoms**: Cannot post comments or access files

**Solutions**:
1. Check GitHub App permissions
2. Verify installation scope includes repository
3. Ensure PR author has write access

#### 4. Analysis Not Triggered

**Symptoms**: No analysis for requirements changes

**Solutions**:
```yaml
# Check file patterns in .dependency-analyzer.yml
requirements_files:
  - "requirements.txt"
  - "requirements/**/*.txt"
  - "**/*requirements*.txt"
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
npx wrangler secret put LOG_LEVEL --env production
# Value: "debug"

# Check debug logs
npx wrangler tail --env production --format pretty
```

### Webhook Testing

Test webhook locally:

```bash
# Use ngrok for local testing
ngrok http 8787

# Update webhook URL to ngrok URL
# Test with GitHub webhook deliveries
```

## 📊 Monitoring

### GitHub App Analytics

Monitor app usage:

1. **Installation Metrics**:
   - Number of installations
   - Active repositories
   - Event frequency

2. **API Usage**:
   - Rate limit consumption
   - API call patterns
   - Error rates

3. **Performance Metrics**:
   - Webhook processing time
   - Analysis duration
   - Comment generation time

### Custom Metrics

Track custom metrics in Worker:

```typescript
// Track GitHub events
metrics.counter("github_webhook_received", 1, {
  event: eventType,
  repository: repository.full_name
});

// Track analysis results
metrics.counter("dependency_analysis_completed", 1, {
  packages_analyzed: packageCount,
  deprecated_found: deprecatedCount,
  security_issues: securityIssues
});
```

## 🔐 Security Considerations

### Webhook Verification

All webhooks are verified using HMAC-SHA256:

```typescript
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ),
    new TextEncoder().encode(payload)
  );
  
  const expectedHex = 'sha256=' + Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  return expectedHex === signature;
}
```

### API Key Protection

- Private keys stored as Worker secrets
- No sensitive data in logs
- Rate limiting for webhook endpoints

### Repository Access

- Minimal required permissions
- Repository-specific installations
- Regular permission audits

## 📈 Advanced Features

### Custom Analysis Rules

Define custom rules in repository:

```yaml
# .dependency-analyzer.yml
custom_rules:
  - name: "No pre-release versions"
    pattern: ".*[ab]\\d+$"
    severity: "warning"
    message: "Pre-release versions detected"
  
  - name: "Prefer specific versions"
    pattern: "^[^=]*$"
    severity: "info"
    message: "Consider pinning to specific versions"
```

### Integration with Other Tools

#### Dependabot

Configure to work with Dependabot:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
    assignees:
      - "dependency-team"
    reviewers:
      - "security-team"
```

#### Renovate

Configure to work with Renovate:

```json
{
  "extends": ["config:base"],
  "packageRules": [
    {
      "managers": ["pip_requirements"],
      "addLabels": ["dependencies", "python"]
    }
  ]
}
```

## 📚 API Reference

### Webhook Endpoints

```http
POST /api/webhooks/github
Content-Type: application/json
X-GitHub-Event: pull_request
X-GitHub-Delivery: uuid
X-Hub-Signature-256: sha256=...
```

### Manual Trigger

```http
POST /api/github/analyze
Content-Type: application/json
Authorization: Bearer <github-token>

{
  "repository": "owner/repo",
  "pull_number": 123,
  "force": false
}
```

### Status Check

```http
GET /api/github/status/:owner/:repo/:pr_number
Authorization: Bearer <github-token>
```

## 🔄 Migration Guide

### From Manual Reviews

If migrating from manual dependency reviews:

1. **Install GitHub App** on key repositories
2. **Train team** on automated analysis
3. **Update workflows** to include status checks
4. **Configure rules** based on existing standards

### From Other Tools

If migrating from other dependency tools:

1. **Export existing configurations**
2. **Map rules** to `.dependency-analyzer.yml`
3. **Test on non-critical repositories**
4. **Gradually expand** to all repositories

---

For more information, see the [API Documentation](./API.md) and [Development Guide](./DEVELOPMENT.md). 