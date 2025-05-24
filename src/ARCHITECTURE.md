# Architecture Overview

This document describes the modular architecture of the Python dependency resolution system built on Cloudflare Agents.

## File Structure

```
src/
├── server.ts                    # Main worker entry point and routing
├── server-original-backup.ts    # Backup of original monolithic file
├── shared.ts                    # Shared types and utilities
├── tools.ts                     # AI tools definitions
├── logger.ts                    # Logging and metrics utilities
├── agents/                      # Agent classes
│   ├── index.ts                 # Exports all agents
│   ├── dependency-resolver-agent.ts
│   ├── package-research-agent.ts
│   └── report-generator-agent.ts
└── services/                    # Business logic services
    ├── index.ts                 # Exports all services
    ├── ai-client.ts            # AI client configuration
    └── package-research.ts     # Package research service
```

## Architecture Principles

### 1. Separation of Concerns

- **Agents** (`/agents/`): Handle HTTP requests, routing, and orchestration
- **Services** (`/services/`): Contain business logic and can be shared between agents
- **Utilities** (`/logger.ts`, `/shared.ts`): Provide common functionality

### 2. Single Responsibility

Each agent has a focused responsibility:

- **DependencyResolverAgent**: Orchestrates the full dependency resolution process
- **PackageResearchAgent**: Specialized for package research operations
- **ReportGeneratorAgent**: Handles report generation (to be implemented)

### 3. Dependency Injection

Services are injected into agents via constructor, making testing and mocking easier:

```typescript
export class DependencyResolverAgent extends Agent<Env> {
  private packageResearchService: PackageResearchService;

  constructor(state: any, env: Env) {
    super(state, env);
    this.packageResearchService = new PackageResearchService(env);
  }
}
```

### 4. Shared Business Logic

The `PackageResearchService` encapsulates package research logic that can be used by multiple agents:

```typescript
// Used by DependencyResolverAgent
const results = await this.packageResearchService.researchMultiplePackages(
  packageNames,
  logger,
  metrics
);

// Used by PackageResearchAgent
const research = await this.packageResearchService.researchPackage(
  packageName,
  logger
);
```

## Benefits of This Architecture

### 1. **Maintainability**

- Smaller, focused files are easier to understand and modify
- Clear separation between different concerns
- Easier to locate and fix bugs

### 2. **Scalability**

- New agents can be added without modifying existing ones
- Services can be extended with new functionality
- Easy to add new business logic services

### 3. **Testability**

- Individual agents and services can be unit tested in isolation
- Services can be mocked when testing agents
- Clear interfaces make testing straightforward

### 4. **Reusability**

- Services can be shared between multiple agents
- Common patterns are extracted into reusable utilities
- AI client configuration is centralized

### 5. **Developer Experience**

- Smaller files are easier to navigate in IDEs
- Import/export structure makes dependencies clear
- Consistent patterns across the codebase

## Agent Communication Patterns

### Request Flow

1. **HTTP Request** → `server.ts` (main worker)
2. **Routing** → Appropriate agent via `routeAgentRequest()`
3. **Agent Processing** → Uses injected services for business logic
4. **Response** → JSON response back to client

### Service Usage

```typescript
// Agents use services for business logic
const service = new PackageResearchService(env);
const result = await service.researchPackage(name, logger);
```

## Extension Points

### Adding New Agents

1. Create agent class in `/agents/`
2. Export from `/agents/index.ts`
3. Export from main `server.ts`
4. Configure Durable Object binding in `wrangler.toml`

### Adding New Services

1. Create service class in `/services/`
2. Export from `/services/index.ts`
3. Inject into agents that need the functionality

### Adding New Tools

1. Define tool in `tools.ts`
2. Use in services or agents as needed

## Error Handling

- Each agent has comprehensive error handling with context
- Services return typed results or error objects
- Logging captures errors with trace IDs for debugging

## Performance Considerations

- Services are instantiated per request to avoid state issues
- Async operations use proper error boundaries
- Metrics collection for monitoring and debugging

## Future Improvements

1. **Report Generation Service**: Extract report generation logic
2. **Caching Service**: Add intelligent caching for PyPI lookups
3. **Validation Service**: Centralize input validation
4. **Notification Service**: Add webhook/notification capabilities
5. **Analytics Service**: Enhanced metrics and insights
