# Deployment Guide

This guide covers everything you need to know about deploying the Python Dependency Resolver to Cloudflare Workers.

## 🌍 Deployment Overview

The Python Dependency Resolver is deployed as a Cloudflare Worker with the following architecture:

- **Worker Runtime**: V8 isolates for fast cold starts
- **Durable Objects**: Stateful agents for complex workflows
- **KV Storage**: Package information caching
- **R2 Storage**: Report and file storage
- **AI Gateway**: LLM request optimization
- **GitHub Integration**: Webhook processing

## 🏗️ Infrastructure Requirements

### Cloudflare Account Setup

1. **Cloudflare Account**: Workers plan ($5/month minimum)
2. **Domain (Optional)**: Custom domain for production
3. **AI Gateway (Optional)**: For LLM request optimization

### Required Services

- **KV Namespace**: Package caching (`PACKAGE_CACHE`)
- **R2 Bucket**: Report storage (`dependency-reports`)
- **Durable Objects**: Agent state management
- **Secrets**: API keys and sensitive configuration

## 🚀 Deployment Environments

### Environment Configuration

The project supports multiple deployment environments:

```toml
# wrangler.toml
[env.development]
vars = { ENVIRONMENT = "development", LOG_LEVEL = "debug" }

[env.staging]
vars = { ENVIRONMENT = "staging", LOG_LEVEL = "debug" }

[env.production]
vars = { ENVIRONMENT = "production", LOG_LEVEL = "info" }
```

### Environment Variables

Each environment requires specific configuration:

```bash
# Required for all environments
OPENAI_API_KEY=sk-your-openai-key
# OR
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_RESOURCE_NAME=your-resource-name
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Optional enhancements
GOOGLE_SEARCH_API_KEY=your-google-search-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_GATEWAY_ID=your-gateway-id

# GitHub integration
GITHUB_APP_ID=your-app-id
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----..."
GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

## 📦 Pre-Deployment Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Authenticate with Cloudflare

```bash
npx wrangler login
```

### 3. Create Required Resources

#### KV Namespace for Caching

```bash
# Create production namespace
npx wrangler kv:namespace create "PACKAGE_CACHE" --env production

# Create preview namespace
npx wrangler kv:namespace create "PACKAGE_CACHE" --preview --env production
```

Update `wrangler.toml` with the generated IDs:

```toml
[[env.production.kv_namespaces]]
binding = "PACKAGE_CACHE"
id = "your-production-kv-id"
preview_id = "your-preview-kv-id"
```

#### R2 Bucket for Reports

```bash
# Create R2 bucket
npx wrangler r2 bucket create dependency-reports
```

Add to `wrangler.toml`:

```toml
[[env.production.r2_buckets]]
binding = "REPORTS_STORAGE"
bucket_name = "dependency-reports"
```

### 4. Configure Secrets

Set production secrets using Wrangler:

```bash
# AI Provider (choose one)
npx wrangler secret put OPENAI_API_KEY --env production
# OR
npx wrangler secret put AZURE_OPENAI_API_KEY --env production
npx wrangler secret put AZURE_OPENAI_RESOURCE_NAME --env production
npx wrangler secret put AZURE_OPENAI_DEPLOYMENT_NAME --env production
npx wrangler secret put AZURE_OPENAI_API_VERSION --env production

# Optional: Enhanced features
npx wrangler secret put GOOGLE_SEARCH_API_KEY --env production
npx wrangler secret put GOOGLE_SEARCH_ENGINE_ID --env production
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID --env production
npx wrangler secret put CLOUDFLARE_GATEWAY_ID --env production

# Optional: GitHub integration
npx wrangler secret put GITHUB_APP_ID --env production
npx wrangler secret put GITHUB_PRIVATE_KEY --env production
npx wrangler secret put GITHUB_WEBHOOK_SECRET --env production
```

## 🚀 Deployment Process

### Development Deployment

Quick deployment for testing:

```bash
npm run deploy:dev
```

This command:
1. Builds the application with development settings
2. Deploys to Cloudflare Workers
3. Uses development environment configuration

### Staging Deployment

Deploy to staging environment:

```bash
npx wrangler deploy --env staging
```

### Production Deployment

Deploy to production:

```bash
npm run deploy
# OR
npm run deploy:production
```

This command:
1. Builds the application with production optimizations
2. Deploys to production environment
3. Uses production secrets and configuration

### Deployment with Custom Domain

If using a custom domain:

```bash
# Add route to wrangler.toml
[env.production]
routes = [
  { pattern = "your-domain.com/*", zone_name = "your-domain.com" }
]

# Deploy
npm run deploy:production
```

## 🔧 Post-Deployment Configuration

### 1. Verify Deployment

Check that all services are working:

```bash
# Health check
curl https://your-worker.workers.dev/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2024-01-15T10:30:00.000Z",
#   "environment": "production",
#   "features": {
#     "ai_provider": "azure",
#     "github_app": true,
#     "search_enabled": true
#   }
# }
```

### 2. Test API Keys

Verify that all API keys are configured correctly:

```bash
curl https://your-worker.workers.dev/check-api-keys

# Expected response:
# {
#   "openai": true,
#   "search": true,
#   "github": true,
#   "provider": "azure"
# }
```

### 3. Test Bindings

Verify Cloudflare bindings (KV, R2, Durable Objects):

```bash
curl https://your-worker.workers.dev/test-bindings

# Expected response:
# {
#   "success": true,
#   "tests": {
#     "kv_write_read": true,
#     "r2_write_read": true
#   },
#   "bindings_available": {
#     "package_cache": true,
#     "reports_storage": true,
#     "agent_namespace": true
#   }
# }
```

### 4. Test AI Client

Verify AI service connectivity:

```bash
curl https://your-worker.workers.dev/test-ai-client

# Expected response:
# {
#   "success": true,
#   "provider": "azure",
#   "message": "AI client initialized successfully"
# }
```

## 📊 Monitoring and Observability

### Cloudflare Analytics

Enable observability in `wrangler.toml`:

```toml
[env.production.observability]
enabled = true
head_sampling_rate = 0.1  # 10% sampling for production
```

### Available Metrics

- **Request Volume**: Total requests per time period
- **Response Time**: P50, P95, P99 latencies
- **Error Rate**: 4xx and 5xx error percentages
- **CPU Usage**: Worker execution time
- **Memory Usage**: Peak memory consumption

### Logging

View real-time logs:

```bash
# Tail logs for production
npx wrangler tail --env production

# Filter by log level
npx wrangler tail --env production --format pretty

# Search logs
npx wrangler tail --env production --search "error"
```

### Custom Metrics

The application includes custom metrics:

```typescript
// Example metrics in the code
metrics.counter("dependency_resolution_started", 1);
metrics.timer("resolution_duration", processingTime);
metrics.counter("package_cache_hit", 1, { package: packageName });
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to staging
        if: github.event_name == 'pull_request'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          environment: staging
          
      - name: Deploy to production
        if: github.ref == 'refs/heads/main'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          environment: production
```

### Required Secrets

Add these secrets to your GitHub repository:

- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with Workers edit permissions
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

## 🛠️ Troubleshooting

### Common Deployment Issues

#### 1. Authentication Errors

```bash
Error: 10000: Authentication error
```

**Solution**: Re-authenticate with Cloudflare:
```bash
npx wrangler logout
npx wrangler login
```

#### 2. Binding Not Found

```bash
Error: Binding 'PACKAGE_CACHE' not found
```

**Solution**: Create the missing binding:
```bash
npx wrangler kv:namespace create "PACKAGE_CACHE" --env production
```

#### 3. Secret Not Available

```bash
Error: AI service not configured
```

**Solution**: Set the required secret:
```bash
npx wrangler secret put OPENAI_API_KEY --env production
```

#### 4. Durable Object Migration

```bash
Error: Durable Object class not found
```

**Solution**: Check `wrangler.toml` for proper migration configuration:
```toml
[[migrations]]
tag = "v1"
new_sqlite_classes = [
  "DependencyResolverAgent",
  "PackageResearchAgent",
  "ReportGeneratorAgent"
]
```

### Debug Commands

```bash
# Check Worker status
npx wrangler deployments list --env production

# View Worker configuration
npx wrangler whoami

# Test specific binding
npx wrangler kv:key get "test-key" --binding PACKAGE_CACHE --env production

# Check Durable Object instances
npx wrangler tail --env production --search "DurableObject"
```

## 🔧 Performance Optimization

### Bundle Size Optimization

1. **Tree Shaking**: Remove unused code
2. **Dynamic Imports**: Lazy load heavy dependencies
3. **Code Splitting**: Split by functionality

Example optimization:

```typescript
// Before: Large bundle
import { someHeavyLibrary } from 'heavy-package';

// After: Dynamic import
const { someHeavyLibrary } = await import('heavy-package');
```

### Cold Start Optimization

1. **Minimize Imports**: Only import what's needed
2. **Lazy Initialization**: Initialize services on-demand
3. **Code Organization**: Keep hot paths lightweight

### Caching Strategy

```typescript
// Package information caching
const cacheKey = `package:${packageName}`;
const cached = await env.PACKAGE_CACHE.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const packageInfo = await fetchPackageInfo(packageName);
await env.PACKAGE_CACHE.put(cacheKey, JSON.stringify(packageInfo), {
  expirationTtl: 3600 // 1 hour
});
```

## 📈 Scaling Considerations

### Request Volume

Cloudflare Workers automatically scale to handle traffic:
- **Free Plan**: 100,000 requests/day
- **Paid Plan**: 10 million requests/month included

### Memory Limits

Workers have a 128MB memory limit:
- Monitor memory usage in analytics
- Optimize large object processing
- Use streaming for large responses

### CPU Time Limits

Workers have execution time limits:
- **Free Plan**: 10ms CPU time
- **Paid Plan**: 50ms CPU time
- **Unbound Workers**: No CPU time limit (additional cost)

### Durable Object Considerations

- Each Durable Object has 128MB memory limit
- Objects can be hibernated when idle
- Use multiple objects for horizontal scaling

## 🔐 Security Considerations

### API Key Management

1. **Use Secrets**: Never commit API keys to code
2. **Rotate Keys**: Regularly rotate API keys
3. **Least Privilege**: Grant minimal required permissions

### CORS Configuration

```typescript
// Configure CORS for production
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-domain.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

### Input Validation

All inputs are validated using Zod schemas:

```typescript
const requestSchema = z.object({
  requirements: z.array(DependencyConstraintSchema),
  python_version: z.string().regex(/^3\.(8|9|10|11|12)$/),
});

const validatedRequest = requestSchema.parse(await request.json());
```

### Rate Limiting

Implement rate limiting for API endpoints:

```typescript
// Rate limiting by IP
const rateLimitKey = `rate_limit:${clientIP}`;
const current = await env.PACKAGE_CACHE.get(rateLimitKey);

if (current && parseInt(current) > 10) {
  return new Response('Rate limited', { status: 429 });
}
```

## 🔄 Rollback Strategy

### Deployment Rollback

If a deployment causes issues:

1. **Quick Rollback**: Deploy previous working version
2. **Version Pinning**: Use specific version tags
3. **Blue-Green**: Use staging environment for testing

```bash
# Rollback to previous deployment
npx wrangler deployments list --env production
npx wrangler rollback [deployment-id] --env production
```

### Database Migration Rollback

For Durable Object schema changes:

```toml
# Add rollback migration
[[migrations]]
tag = "v2-rollback"
deleted_sqlite_classes = ["NewFeatureAgent"]
```

## 📚 Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Durable Objects Guide](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/)
- [KV Storage Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [R2 Storage Documentation](https://developers.cloudflare.com/r2/)

---

For development setup and testing, see the [Development Guide](./DEVELOPMENT.md). 