# GitHub Integration Setup Guide

This guide will help you set up GitHub integration for the Python Dependency Resolver, enabling automated dependency analysis on pull requests and GitHub Actions workflows.

## 🚀 Quick Setup

### Prerequisites

- Deployed Cloudflare Worker (your Python Dependency Resolver)
- GitHub account with admin access to repositories
- GitHub CLI (optional, but recommended)

### 1. Run the Setup Script

```bash
# Make the script executable
chmod +x scripts/setup-github-integration.sh

# Run the interactive setup
./scripts/setup-github-integration.sh
```

The script will guide you through the entire process interactively.

## 📋 Manual Setup

If you prefer manual setup or the script doesn't work in your environment:

### Step 1: Create GitHub App

1. Go to [GitHub App Settings](https://github.com/settings/apps/new)
   - For organizations: `https://github.com/organizations/YOUR_ORG/settings/apps/new`

2. Fill in the GitHub App details:
   - **GitHub App name**: `Python Dependency Resolver`
   - **Description**: `AI-powered Python dependency analysis for pull requests`
   - **Homepage URL**: `https://your-worker.workers.dev`
   - **Webhook URL**: `https://your-worker.workers.dev/api/webhooks/github`
   - **Webhook secret**: Generate a secure random string (save this!)

3. Set Repository Permissions:
   - **Contents**: Read
   - **Issues**: Write  
   - **Pull requests**: Write
   - **Checks**: Write

4. Subscribe to Events:
   - [x] Push
   - [x] Pull request
   - [x] Installation
   - [x] Installation repositories

5. Create the app and save:
   - **App ID** (displayed after creation)
   - **Private Key** (download the PEM file)

### Step 2: Configure Environment Variables

Add these secrets to your Cloudflare Worker:

```bash
# Required secrets
wrangler secret put GITHUB_APP_ID
wrangler secret put GITHUB_PRIVATE_KEY
wrangler secret put GITHUB_WEBHOOK_SECRET

# Optional (for OAuth features)
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET

# For GitHub Enterprise (if applicable)
wrangler secret put GITHUB_ENTERPRISE_HOST
```

Update your `.dev.vars` file for local development:

```env
# GitHub App Configuration
GITHUB_APP_ID=123456
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----"

# Optional OAuth credentials
GITHUB_CLIENT_ID=Iv1.your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# For GitHub Enterprise (optional)
GITHUB_ENTERPRISE_HOST=github.yourcompany.com

# Base URL for API calls
BASE_URL=https://your-worker.workers.dev
```

### Step 3: Deploy Updated Worker

```bash
npm run deploy
```

### Step 4: Install GitHub App

1. Go to your GitHub App settings page
2. Click "Install App" 
3. Choose which repositories to analyze
4. Grant the necessary permissions

### Step 5: Test the Integration

1. Create a test repository or use an existing one
2. Add or modify a `requirements.txt` file
3. Open a pull request
4. Watch for automated analysis comments from the bot

## 🔐 Required Secrets Summary

Here's a comprehensive list of all secrets you need to configure:

### Core GitHub Integration (Required)

| Secret Name | Description | Where to Get It |
|-------------|-------------|-----------------|
| `GITHUB_APP_ID` | Your GitHub App's ID | GitHub App settings page |
| `GITHUB_PRIVATE_KEY` | Private key for authentication | Download from GitHub App settings |
| `GITHUB_WEBHOOK_SECRET` | Secret for webhook verification | Generate a secure random string |
| `BASE_URL` | Your worker's URL | Your Cloudflare Worker URL |

### Optional GitHub Features

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `GITHUB_CLIENT_ID` | OAuth App client ID | OAuth user authentication |
| `GITHUB_CLIENT_SECRET` | OAuth App client secret | OAuth user authentication |
| `GITHUB_ENTERPRISE_HOST` | Enterprise GitHub hostname | GitHub Enterprise Server |

### AI and Search (For Core Functionality)

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | ✅ (if not using Azure) |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key | ✅ (if not using OpenAI) |
| `AZURE_OPENAI_RESOURCE_NAME` | Azure resource name | ✅ (if using Azure) |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Azure deployment name | ✅ (if using Azure) |
| `AZURE_OPENAI_API_VERSION` | Azure API version | ✅ (if using Azure) |
| `GOOGLE_SEARCH_API_KEY` | Google Custom Search API | ⚠️ (enhances deprecation detection) |
| `GOOGLE_SEARCH_ENGINE_ID` | Google Search Engine ID | ⚠️ (enhances deprecation detection) |

## 🔄 Setting Secrets in Cloudflare Workers

Use the Wrangler CLI to set each secret:

```bash
# Example for GitHub App ID
wrangler secret put GITHUB_APP_ID
# Enter your app ID when prompted

# Example for private key (multiline)
wrangler secret put GITHUB_PRIVATE_KEY
# Paste your entire private key including header/footer lines

# For the webhook secret
wrangler secret put GITHUB_WEBHOOK_SECRET
# Enter your generated webhook secret
```

## 📱 GitHub Actions Integration

The project includes a GitHub Actions workflow for dependency checking. Update `.github/workflows/dependency-check.yml` with your worker URL:

```yaml
name: Dependency Check
on:
  pull_request:
    paths:
      - '**/requirements*.txt'
      - '**/pyproject.toml'
      - '**/Pipfile'

jobs:
  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Analyze Dependencies
        run: |
          # Replace with your actual worker URL
          BASE_URL="https://your-worker.workers.dev"
          
          # Your analysis logic here
```

## 🐛 Troubleshooting

### Common Issues

**1. Webhook delivery failed**
- Check that your webhook URL is correct
- Ensure your worker is deployed and accessible
- Verify webhook secret matches

**2. Authentication errors**
- Confirm private key is properly formatted
- Check App ID is correct
- Ensure app is installed on the repository

**3. Missing permissions**
- Verify app has required repository permissions
- Check that app is installed with correct scope

### Testing Webhook Delivery

Test your webhook endpoint:

```bash
curl -X POST https://your-worker.workers.dev/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: ping" \
  -H "X-GitHub-Delivery: test-123" \
  -H "X-Hub-Signature-256: sha256=test" \
  -d '{"zen": "Testing webhook delivery"}'
```

### Debug Mode

Enable debug logging by setting:

```bash
wrangler secret put LOG_LEVEL
# Enter: debug
```

Check logs with:

```bash
wrangler tail
```

## 🎯 What Happens After Setup

Once configured, your GitHub integration will:

### On Pull Requests:
1. **Detect** `requirements.txt` changes
2. **Analyze** new/modified dependencies
3. **Report** findings as PR comments including:
   - ✅ Resolved package versions
   - ⚠️ Deprecated packages with alternatives
   - ❌ Version conflicts with solutions
   - 🔒 Security vulnerabilities

### On Main Branch Push:
1. **Monitor** dependency health
2. **Create** issues for critical problems
3. **Update** dependency status

### Example Comment Output:

```markdown
## 🔍 Dependency Analysis for `requirements.txt`

✅ **Analysis completed successfully**

### 📦 Resolved Packages (3)
- **numpy** → `1.24.3`
- **pandas** → `2.0.1` 
- **requests** → `2.31.0`

### ⚠️ Deprecated Packages (1)
- **fabric** `1.14.0`
  - Reason: No longer maintained, last update 2019
  - 💡 Consider: `fabric2` or `invoke`

---
*Powered by [Python Dependency Resolver](https://your-worker.workers.dev)*
```

## 📚 Additional Resources

- [GitHub Apps Documentation](https://docs.github.com/en/developers/apps)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Webhook Security](https://docs.github.com/en/developers/webhooks-and-events/webhooks/securing-your-webhooks)

## 🤝 Support

If you encounter issues:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review worker logs: `wrangler tail`
3. Test webhook delivery manually
4. Verify all secrets are properly set

For additional help, please open an issue with:
- Your worker logs
- Webhook delivery attempts
- Configuration details (without secrets!) 