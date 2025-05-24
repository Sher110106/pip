# Development Guide

This guide covers everything you need to know to develop, test, and contribute to the Python Dependency Resolver project.

## 🏗️ Project Overview

The Python Dependency Resolver is a sophisticated AI-powered system built on Cloudflare Workers that intelligently resolves Python package dependencies, detects deprecated packages, and suggests alternatives. It features:

- **Multi-Agent Architecture**: Specialized AI agents for different aspects of dependency resolution
- **Edge Computing**: Runs on Cloudflare's global edge network for fast response times
- **Modern Frontend**: React/TypeScript interface with Tailwind CSS
- **GitHub Integration**: Automated PR analysis and dependency checking
- **Intelligent Caching**: KV storage for package information and R2 for reports

## 🛠️ Technology Stack

### Backend
- **Runtime**: Cloudflare Workers (V8 isolates)
- **Language**: TypeScript
- **AI Framework**: Vercel AI SDK with Azure OpenAI/OpenAI
- **Agent Framework**: Custom agent system with Durable Objects
- **Storage**: Cloudflare KV (caching) + R2 (reports)
- **APIs**: PyPI, Google Search, GitHub

### Frontend
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite
- **UI Components**: Radix UI primitives
- **Animations**: GSAP
- **Markdown**: React Markdown with GFM support

### Development Tools
- **Package Manager**: npm
- **Linting**: Biome
- **Formatting**: Prettier
- **Testing**: Vitest with Cloudflare Workers pool
- **Deployment**: Wrangler (Cloudflare CLI)

## 📁 Project Structure

```
agents-starter/
├── src/
│   ├── agents/                     # Durable Object agents
│   │   ├── dependency-resolver-agent.ts
│   │   ├── package-research-agent.ts
│   │   └── report-generator-agent.ts
│   ├── components/                 # React UI components
│   │   ├── home/                   # Landing page sections
│   │   ├── ui/                     # Reusable UI components
│   │   └── tool-invocation-card/   # AI tool execution display
│   ├── services/                   # Business logic services
│   │   ├── ai-client.ts           # AI provider configuration
│   │   ├── github-app.ts          # GitHub integration
│   │   └── package-research.ts    # Package analysis logic
│   ├── hooks/                      # React hooks
│   ├── lib/                        # Utility libraries
│   ├── providers/                  # React context providers
│   ├── app.tsx                     # Main React application
│   ├── server.ts                   # Worker entry point
│   ├── shared.ts                   # Shared types and schemas
│   ├── tools.ts                    # AI tools definitions
│   └── logger.ts                   # Logging and metrics
├── examples/                       # Usage examples
├── scripts/                        # Setup and utility scripts
├── tests/                          # Test files
├── public/                         # Static assets
├── wrangler.toml                   # Cloudflare configuration
└── package.json                    # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: use nvm)
- **Cloudflare Account** with Workers plan
- **AI API Access** (OpenAI or Azure OpenAI)
- **Git** for version control

### 1. Environment Setup

```bash
# Clone the repository
git clone https://github.com/your-org/agents-starter.git
cd agents-starter

# Install dependencies
npm install

# Copy environment template
cp .dev.vars.example .dev.vars
```

### 2. Configure Environment Variables

Edit `.dev.vars` with your API keys:

```bash
# Required: AI Provider (choose one)
OPENAI_API_KEY=sk-your-openai-key
# OR
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_RESOURCE_NAME=your-resource-name
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Optional: Enhanced features
GOOGLE_SEARCH_API_KEY=your-google-search-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_GATEWAY_ID=your-gateway-id

# Optional: GitHub integration
GITHUB_APP_ID=your-app-id
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----..."
GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

### 3. Set Up Cloudflare Resources

```bash
# Authenticate with Cloudflare
npx wrangler login

# Create KV namespace for package caching
npx wrangler kv:namespace create "PACKAGE_CACHE"
npx wrangler kv:namespace create "PACKAGE_CACHE" --preview

# Create R2 bucket for report storage
npx wrangler r2 bucket create dependency-reports

# Update wrangler.toml with the generated IDs
```

Update `wrangler.toml` with the generated namespace IDs:

```toml
[[kv_namespaces]]
binding = "PACKAGE_CACHE"
id = "your-generated-id"
preview_id = "your-generated-preview-id"
```

### 4. Development Server

```bash
# Start the development server
npm start

# This will:
# - Start Vite dev server for the frontend
# - Run Cloudflare Workers locally
# - Enable hot reloading for both frontend and backend
# - Open http://localhost:5173
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- dependency-resolver.test.ts
```

### Test Structure

```
tests/
├── unit/                   # Unit tests for individual functions
├── integration/            # Integration tests for agent workflows
├── e2e/                   # End-to-end tests for complete flows
└── fixtures/              # Test data and mock responses
```

### Writing Tests

Example unit test:

```typescript
import { describe, it, expect } from 'vitest';
import { parseRequirementString } from '../src/shared';

describe('parseRequirementString', () => {
  it('should parse simple package names', () => {
    const result = parseRequirementString('numpy');
    expect(result.name).toBe('numpy');
    expect(result.operator).toBe('');
  });

  it('should parse version constraints', () => {
    const result = parseRequirementString('numpy>=1.19.0');
    expect(result.name).toBe('numpy');
    expect(result.operator).toBe('>=');
    expect(result.version).toBe('1.19.0');
  });
});
```

Example integration test:

```typescript
import { describe, it, expect } from 'vitest';
import { env, createExecutionContext } from 'cloudflare:test';
import { DependencyResolverAgent } from '../src/agents/dependency-resolver-agent';

describe('DependencyResolverAgent', () => {
  it('should resolve simple dependencies', async () => {
    const id = env.DependencyResolverAgent.idFromName('test');
    const agent = env.DependencyResolverAgent.get(id);
    
    const request = new Request('http://localhost/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirements: [{ name: 'requests', operator: '', version: '' }],
        python_version: '3.9'
      })
    });

    const response = await agent.fetch(request);
    expect(response.status).toBe(200);
  });
});
```

## 🎨 Frontend Development

### Component Guidelines

1. **Use TypeScript**: All components should be strongly typed
2. **Functional Components**: Prefer function components with hooks
3. **Composition**: Use composition over inheritance
4. **Accessibility**: Follow WAI-ARIA guidelines
5. **Responsive**: Mobile-first responsive design

### Example Component Structure

```typescript
interface ComponentProps {
  title: string;
  onAction: (data: any) => void;
  className?: string;
}

export function Component({ title, onAction, className }: ComponentProps) {
  const [state, setState] = useState<State>();
  
  return (
    <div className={cn("default-styles", className)}>
      <h2>{title}</h2>
      {/* Component content */}
    </div>
  );
}
```

### Styling Guidelines

- Use Tailwind CSS utility classes
- Create reusable component variants with `class-variance-authority`
- Keep custom CSS minimal in `src/styles.css`
- Use CSS custom properties for theming

### State Management

- **Local State**: React `useState` for component-specific state
- **Server State**: Vercel AI SDK for AI interactions
- **URL State**: React Router for navigation state
- **Global State**: React Context for cross-component state

## 🤖 Backend Development

### Agent Architecture

The system uses a multi-agent architecture where each agent handles specific responsibilities:

1. **DependencyResolverAgent**: Main orchestrator
2. **PackageResearchAgent**: Package information gathering
3. **ReportGeneratorAgent**: Report generation and formatting

### Adding New Agents

1. Create agent class in `src/agents/`:

```typescript
import { Agent } from "agents";
import type { Env } from "../shared";

export class MyNewAgent extends Agent<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/my-endpoint') {
      return this.handleMyEndpoint(request);
    }
    
    return new Response('Not found', { status: 404 });
  }

  private async handleMyEndpoint(request: Request): Promise<Response> {
    // Agent logic here
    return Response.json({ success: true });
  }
}
```

2. Export from `src/agents/index.ts`
3. Add binding to `wrangler.toml`
4. Export from `src/server.ts`

### Adding New Services

Services contain reusable business logic:

```typescript
// src/services/my-service.ts
import type { Env } from "../shared";

export class MyService {
  constructor(private env: Env) {}

  async performTask(input: string): Promise<Result> {
    // Service logic
    return result;
  }
}
```

### AI Tools Development

AI tools define what actions the AI can take:

```typescript
// src/tools.ts
export const myCustomTool = tool({
  description: "Performs a custom analysis task",
  parameters: z.object({
    input: z.string().describe("The input to analyze"),
    options: z.object({
      detailed: z.boolean().default(false)
    }).optional()
  }),
  execute: async ({ input, options }) => {
    // Tool execution logic
    return {
      result: "Analysis complete",
      details: options?.detailed ? "Detailed info" : undefined
    };
  }
});
```

## 🚀 Deployment

### Development Deployment

```bash
# Deploy to development environment
npm run deploy:dev

# This will:
# - Build the application with development settings
# - Deploy to Cloudflare Workers
# - Use development bindings and environment variables
```

### Production Deployment

```bash
# Deploy to production
npm run deploy

# Or explicitly
npm run deploy:production
```

### Environment-Specific Configuration

The project supports multiple environments configured in `wrangler.toml`:

- **development**: Local development with debug logging
- **staging**: Pre-production testing environment
- **production**: Production environment with optimized settings

### Setting Secrets

After deployment, set production secrets:

```bash
# Set AI provider secrets
wrangler secret put OPENAI_API_KEY --env production
wrangler secret put AZURE_OPENAI_API_KEY --env production

# Set GitHub integration secrets
wrangler secret put GITHUB_PRIVATE_KEY --env production
wrangler secret put GITHUB_WEBHOOK_SECRET --env production

# Set search secrets
wrangler secret put GOOGLE_SEARCH_API_KEY --env production
```

### Monitoring Deployment

```bash
# Check deployment status
wrangler deployments list

# View logs
wrangler tail

# Check health
curl https://your-worker.workers.dev/health
```

## 🔧 Debugging

### Development Debugging

1. **Console Logs**: Use structured logging with the logger service
2. **Browser DevTools**: Standard React debugging
3. **Network Tab**: Monitor API calls and responses
4. **Wrangler Logs**: `wrangler tail` for real-time logs

### Production Debugging

1. **Cloudflare Dashboard**: View Worker analytics and logs
2. **AI Gateway**: Monitor AI API usage and costs
3. **Error Tracking**: Structured error logging with context
4. **Performance Monitoring**: Worker execution time and resource usage

### Common Issues

1. **API Key Issues**: Check `/check-api-keys` endpoint
2. **Binding Issues**: Test with `/test-bindings` endpoint
3. **AI Client Issues**: Use `/test-ai-client` endpoint
4. **CORS Issues**: Verify origin settings in Worker

## 📊 Performance Optimization

### Frontend Optimization

- **Code Splitting**: Automatic with Vite
- **Tree Shaking**: Remove unused code
- **Bundle Analysis**: Use `npm run build -- --analyze`
- **Image Optimization**: Use appropriate formats and sizes

### Backend Optimization

- **Cold Start Optimization**: Minimize import statements
- **Caching Strategy**: Leverage KV and R2 storage
- **Batch Operations**: Group related API calls
- **AI Gateway**: Use for request deduplication

### Monitoring

- **Core Web Vitals**: Monitor frontend performance
- **Worker Analytics**: Track execution time and requests
- **AI Usage**: Monitor token consumption and costs
- **Error Rates**: Track and alert on error spikes

## 🤝 Contributing Guidelines

### Code Style

1. **Formatting**: Use Prettier (automatically applied)
2. **Linting**: Follow Biome rules
3. **TypeScript**: Strict mode enabled
4. **Naming**: Use descriptive, consistent naming

### Pull Request Process

1. **Branch Naming**: `feature/description` or `fix/description`
2. **Commit Messages**: Use conventional commits format
3. **Testing**: Ensure all tests pass
4. **Documentation**: Update relevant docs
5. **Code Review**: Require approval from maintainers

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
# Create PR through GitHub UI
```

## 📚 Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🆘 Getting Help

1. **Documentation**: Check this guide and other docs in `/docs`
2. **GitHub Issues**: Search existing issues or create new ones
3. **Discussions**: Use GitHub Discussions for questions
4. **Discord**: Join our community Discord server
5. **Email**: Contact maintainers directly

---

Happy coding! 🎉 