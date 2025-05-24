# API Reference

This document provides comprehensive API documentation for the Python Dependency Resolver system.

## 🌍 Base URLs

- **Production**: `https://python-dependency-resolver.bugzer.workers.dev`
- **Staging**: `https://staging-python-dependency-resolver.bugzer.workers.dev`
- **Local Development**: `http://localhost:8787`

## 🔐 Authentication

Most endpoints do not require authentication, but rate limiting may apply. GitHub webhook endpoints require proper webhook signature verification.

## 📋 Core API Endpoints

### Health Check

Get system health and configuration status.

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production",
  "features": {
    "ai_provider": "azure",
    "github_app": true,
    "search_enabled": true
  }
}
```

### API Keys Check

Verify configured API keys and services.

```http
GET /check-api-keys
```

**Response:**
```json
{
  "openai": true,
  "search": true,
  "github": false,
  "provider": "azure"
}
```

## 🤖 Agent Endpoints

### Dependency Resolver Agent

Main agent for dependency resolution orchestration.

#### Start Resolution

Initiate a new dependency resolution process.

```http
POST /agents/dependency-resolver-agent/resolve
Content-Type: application/json
```

**Request Body:**
```json
{
  "requirements": [
    {
      "name": "numpy",
      "operator": ">=",
      "version": "1.19.0",
      "original_spec": "numpy>=1.19.0"
    },
    {
      "name": "pandas",
      "operator": "",
      "version": "",
      "original_spec": "pandas"
    }
  ],
  "python_version": "3.9",
  "allow_prereleases": false,
  "prefer_stable": true,
  "exclude_deprecated": true,
  "suggest_alternatives": true
}
```

**Response:**
```json
{
  "id": "report-123e4567-e89b-12d3-a456-426614174000",
  "status": "processing",
  "message": "Dependency resolution started",
  "estimated_completion": "2024-01-15T10:35:00.000Z"
}
```

#### Check Resolution Status

Get the status of an ongoing resolution process.

```http
GET /agents/dependency-resolver-agent/status?id={report-id}
```

**Response:**
```json
{
  "id": "report-123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "progress": 100,
  "result": {
    "success": true,
    "resolved_packages": [
      {
        "name": "numpy",
        "version": "1.21.0"
      },
      {
        "name": "pandas",
        "version": "1.3.3"
      }
    ],
    "deprecated_packages": [],
    "conflicts": []
  },
  "requirements_txt": "# Generated requirements.txt\nnumpy==1.21.0\npandas==1.3.3\n",
  "detailed_report": "# Dependency Resolution Report\n\n## Summary\n...",
  "processing_time_ms": 15000
}
```

#### Get Resolution Report

Retrieve a complete resolution report.

```http
GET /agents/dependency-resolver-agent/report/{report-id}
```

**Response:**
```json
{
  "id": "report-123e4567-e89b-12d3-a456-426614174000",
  "created_at": "2024-01-15T10:30:00.000Z",
  "request": {
    "requirements": [...],
    "python_version": "3.9"
  },
  "result": {
    "success": true,
    "resolved_packages": [...]
  },
  "requirements_txt": "numpy==1.21.0\npandas==1.3.3\n",
  "detailed_report": "# Dependency Resolution Report\n...",
  "package_analysis": [
    {
      "name": "numpy",
      "current_version": "1.21.0",
      "recommended_version": "1.21.0",
      "analysis": "Package is up to date and compatible",
      "security_notes": [],
      "compatibility_notes": []
    }
  ],
  "metadata": {
    "python_version": "3.9",
    "total_packages": 2,
    "deprecated_count": 0,
    "conflict_count": 0,
    "processing_time_ms": 15000
  }
}
```

### Package Research Agent

Specialized agent for package information gathering.

#### Research Package

Get detailed information about a specific package.

```http
POST /agents/package-research-agent/research
Content-Type: application/json
```

**Request Body:**
```json
{
  "package_name": "numpy",
  "include_deprecation_check": true,
  "include_security_analysis": true
}
```

**Response:**
```json
{
  "package_name": "numpy",
  "pypi_data": {
    "name": "numpy",
    "summary": "Fundamental package for array computing",
    "latest_version": "1.21.0",
    "versions": [...],
    "deprecated": false,
    "maintainer_status": "active"
  },
  "deprecation_analysis": {
    "is_deprecated": false,
    "confidence": 0.95,
    "evidence": [],
    "alternatives": []
  },
  "security_analysis": {
    "vulnerabilities": [],
    "risk_level": "low",
    "last_updated": "2024-01-15T10:30:00.000Z"
  },
  "search_results": [
    {
      "title": "NumPy - Official Documentation",
      "url": "https://numpy.org/doc/stable/",
      "snippet": "NumPy is the fundamental package for scientific computing",
      "relevance_score": 0.95
    }
  ]
}
```

#### Batch Research

Research multiple packages in a single request.

```http
POST /agents/package-research-agent/research-batch
Content-Type: application/json
```

**Request Body:**
```json
{
  "package_names": ["numpy", "pandas", "scipy"],
  "include_deprecation_check": true,
  "include_security_analysis": false
}
```

**Response:**
```json
{
  "results": [
    {
      "package_name": "numpy",
      "pypi_data": {...},
      "deprecation_analysis": {...}
    },
    {
      "package_name": "pandas",
      "pypi_data": {...},
      "deprecation_analysis": {...}
    }
  ],
  "processing_time_ms": 8000,
  "cache_hits": 1,
  "cache_misses": 2
}
```

### Report Generator Agent

Agent for generating formatted reports and requirements files.

#### Generate Report

Create a formatted report from resolution results.

```http
POST /agents/report-generator-agent/generate
Content-Type: application/json
```

**Request Body:**
```json
{
  "resolution_result": {
    "success": true,
    "resolved_packages": [...],
    "deprecated_packages": [...],
    "conflicts": [...]
  },
  "request_metadata": {
    "python_version": "3.9",
    "allow_prereleases": false
  },
  "format": "markdown"
}
```

**Response:**
```json
{
  "report_id": "report-123e4567-e89b-12d3-a456-426614174000",
  "requirements_txt": "# Generated on 2024-01-15\nnumpy==1.21.0\npandas==1.3.3\n",
  "detailed_report": "# Dependency Resolution Report\n\n## Summary\n...",
  "formats": {
    "markdown": "# Report...",
    "json": {...},
    "txt": "Plain text report..."
  }
}
```

## 🐙 GitHub Integration

### Webhook Endpoint

Receive and process GitHub webhooks for PR analysis.

```http
POST /api/webhooks/github
Content-Type: application/json
X-GitHub-Event: pull_request
X-GitHub-Delivery: 12345678-1234-1234-1234-123456789012
X-Hub-Signature-256: sha256=...
```

**Request Body (Pull Request Event):**
```json
{
  "action": "opened",
  "number": 123,
  "pull_request": {
    "id": 1234567890,
    "number": 123,
    "title": "Update dependencies",
    "body": "This PR updates our Python dependencies",
    "head": {
      "sha": "abc123",
      "ref": "feature/update-deps"
    },
    "base": {
      "sha": "def456",
      "ref": "main"
    }
  },
  "repository": {
    "id": 123456789,
    "name": "my-project",
    "full_name": "org/my-project"
  }
}
```

**Response:**
```json
{
  "status": "processed",
  "action": "comment_added",
  "analysis_id": "analysis-123e4567-e89b-12d3-a456-426614174000"
}
```

## 🔧 Utility Endpoints

### Test Bindings

Test Cloudflare bindings (KV, R2, Durable Objects).

```http
GET /test-bindings
```

**Response:**
```json
{
  "success": true,
  "tests": {
    "kv_write_read": true,
    "r2_write_read": true,
    "kv_value": "test-value",
    "r2_content": "{\"test\":\"data\"}"
  },
  "bindings_available": {
    "package_cache": true,
    "reports_storage": true,
    "agent_namespace": true
  }
}
```

### Test AI Client

Verify AI client configuration.

```http
GET /test-ai-client
```

**Response:**
```json
{
  "success": true,
  "provider": "azure",
  "message": "AI client initialized successfully"
}
```

## 📊 Data Schemas

### DependencyConstraint

```typescript
interface DependencyConstraint {
  name: string;
  operator: "==" | ">=" | ">" | "<=" | "<" | "!=" | "~=" | "===" | "";
  version?: string;
  fixed?: boolean;
  original_spec: string;
}
```

### ResolutionRequest

```typescript
interface ResolutionRequest {
  requirements: DependencyConstraint[];
  python_version?: string; // default: "3.9"
  allow_prereleases?: boolean; // default: false
  prefer_stable?: boolean; // default: true
  exclude_deprecated?: boolean; // default: true
  suggest_alternatives?: boolean; // default: true
}
```

### ResolutionResult

```typescript
interface ResolutionResult {
  success: boolean;
  resolved_packages?: {
    name: string;
    version: string;
  }[];
  deprecated_packages?: {
    name: string;
    version: string;
    reason: string;
    suggested_alternative?: string;
  }[];
  conflicts?: {
    packages: string[];
    reason: string;
    suggested_resolution?: string;
  }[];
  error?: string;
}
```

### PackageInfo

```typescript
interface PackageInfo {
  name: string;
  summary?: string;
  description?: string;
  home_page?: string;
  author?: string;
  license?: string;
  versions: PackageVersion[];
  latest_version: string;
  requires_python?: string;
  deprecated?: boolean;
  deprecation_reason?: string;
  alternatives?: string[];
  maintainer_status: "active" | "maintenance" | "deprecated" | "abandoned";
}
```

## ❌ Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "request_id": "req-123e4567-e89b-12d3-a456-426614174000"
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_REQUEST` | Malformed request body | 400 |
| `MISSING_REQUIREMENTS` | No requirements provided | 400 |
| `INVALID_PYTHON_VERSION` | Unsupported Python version | 400 |
| `PACKAGE_NOT_FOUND` | Package doesn't exist on PyPI | 404 |
| `RESOLUTION_FAILED` | Unable to resolve dependencies | 422 |
| `AI_SERVICE_ERROR` | AI service unavailable | 503 |
| `RATE_LIMITED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |

### Example Error Responses

**Invalid Request:**
```json
{
  "error": "Invalid request body",
  "code": "INVALID_REQUEST",
  "details": {
    "requirements": "Field is required"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "request_id": "req-123e4567-e89b-12d3-a456-426614174000"
}
```

**Package Not Found:**
```json
{
  "error": "Package 'nonexistent-package' not found on PyPI",
  "code": "PACKAGE_NOT_FOUND",
  "details": {
    "package_name": "nonexistent-package",
    "suggestions": ["similar-package-1", "similar-package-2"]
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "request_id": "req-123e4567-e89b-12d3-a456-426614174000"
}
```

## 🔄 Rate Limiting

Rate limits are applied per IP address:

- **Resolution Endpoints**: 10 requests per minute
- **Research Endpoints**: 30 requests per minute
- **Health/Status Endpoints**: 100 requests per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1642248000
```

## 📝 Usage Examples

### Basic Dependency Resolution

```bash
curl -X POST https://python-dependency-resolver.bugzer.workers.dev/agents/dependency-resolver-agent/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "requirements": [
      {
        "name": "requests",
        "operator": ">=",
        "version": "2.25.0",
        "original_spec": "requests>=2.25.0"
      }
    ],
    "python_version": "3.9"
  }'
```

### Package Research

```bash
curl -X POST https://python-dependency-resolver.bugzer.workers.dev/agents/package-research-agent/research \
  -H "Content-Type: application/json" \
  -d '{
    "package_name": "django",
    "include_deprecation_check": true,
    "include_security_analysis": true
  }'
```

### Check Resolution Status

```bash
curl "https://python-dependency-resolver.bugzer.workers.dev/agents/dependency-resolver-agent/status?id=report-123e4567-e89b-12d3-a456-426614174000"
```

## 🔐 Security

### Webhook Verification

GitHub webhooks are verified using HMAC-SHA256:

```typescript
const signature = request.headers.get('x-hub-signature-256');
const payload = await request.text();
const expectedSignature = await crypto.subtle.sign(
  'HMAC',
  await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  ),
  new TextEncoder().encode(payload)
);
```

### API Key Protection

API keys are stored as Cloudflare Worker secrets and never exposed in responses or logs.

### Input Validation

All inputs are validated using Zod schemas before processing.

## 📊 Monitoring and Metrics

### Available Metrics

- Request count and latency
- Resolution success/failure rates
- Package cache hit rates
- AI token usage
- Error rates by type

### Health Monitoring

The `/health` endpoint provides comprehensive system status and can be used for uptime monitoring.

---

For more information, see the [Development Guide](./DEVELOPMENT.md) or [Architecture Documentation](../src/ARCHITECTURE.md). 