# K8sNode API

A production-ready Node.js API built with TypeScript, Hono.js, and configured for Kubernetes deployment on AWS EKS.

## 🚀 Features

- **Framework**: Hono.js with TypeScript for high performance
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Validation**: Request validation using Zod schemas
- **Logging**: Structured JSON logging with request tracing
- **Security**: CORS, security headers, non-root container execution
- **Health Checks**: Comprehensive health monitoring with system metrics
- **Container**: Multi-stage Docker build optimized for production
- **Orchestration**: Kubernetes deployments with HPA auto-scaling
- **CI/CD**: GitHub Actions pipeline for AWS EKS deployment

## 📋 Table of Contents

- [API Endpoints](#api-endpoints)
- [Development Setup](#development-setup)
- [Docker](#docker)
- [Kubernetes Deployment](#kubernetes-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## 🔌 API Endpoints

### GET /health

Returns system health status and metrics.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-07-30T02:52:34.000Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "memory": {
    "used": 45,
    "total": 128,
    "percentage": 35
  }
}
```

### POST /auth

Authenticate user and receive JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "username": "admin"
  }
}
```

### Default Users

The API comes with pre-configured users for testing:

| Username | Password | User ID |
|----------|----------|---------|
| admin    | admin123 | 1       |
| user     | user123  | 2       |
| test     | test123  | 3       |

## 🛠 Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (optional)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Milivitoria/k8snode.git
   cd k8snode
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🐳 Docker

### Building the Image

```bash
# Build for development
docker build --target development -t k8snode-api:dev .

# Build for production
docker build --target production -t k8snode-api:latest .
```

### Running with Docker

```bash
# Run development container
docker run -p 3000:3000 -e NODE_ENV=development k8snode-api:dev

# Run production container
docker run -p 3000:3000 -e NODE_ENV=production k8snode-api:latest
```

## ☸️ Kubernetes Deployment

### 🌟 Gateway API (Recomendado)

Este projeto usa **Gateway API** para roteamento avançado, substituindo o Ingress tradicional.

**🚀 Deploy Rápido:**
```bash
# Deploy completo (HML + PRD)
./deploy-gateway.sh all

# Apenas homologação
./deploy-gateway.sh hml

# Apenas produção
./deploy-gateway.sh prd
```

**📖 Documentação Completa:** [Gateway API README](./k8s/GATEWAY_API_README.md)

### 🔍 Validação de Configuração

Antes de fazer o deploy, é recomendado validar todas as configurações:

```bash
# Validar todas as configurações
./validate-config.sh all

# Validar apenas HML
./validate-config.sh hml

# Validar apenas PRD
./validate-config.sh prd
```

O script de validação verifica:
- Sintaxe YAML de todos os manifestos Kubernetes
- Configurações específicas do ambiente
- Configuração da aplicação (build, Dockerfile)
- Pipeline de CI/CD

### Prerequisites

- Kubernetes cluster (EKS, GKE, AKS)
- kubectl configurado
- Gateway API CRDs instalados
- NGINX Gateway Fabric ou similar

### Deployment Environments

#### HML (Homologação)
- **Namespace**: `k8snode-hml`
- **Replicas**: 2-5 (auto-scaling)
- **Resources**: 100m CPU, 128Mi RAM (limits: 500m CPU, 512Mi RAM)
- **Domínios**: `hml.yourdomain.com`, `api-hml.yourdomain.com`
- **SSL**: Let's Encrypt Staging

#### PRD (Produção)
- **Namespace**: `k8snode-prd`
- **Replicas**: 3-10 (auto-scaling)
- **Resources**: 200m CPU, 256Mi RAM (limits: 1000m CPU, 1Gi RAM)
- **Domínios**: `yourdomain.com`, `api.yourdomain.com`
- **SSL**: Let's Encrypt Production

### 🔧 Manual Deployment

1. **Instalar Gateway API CRDs:**
   ```bash
   kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.0.0/standard-install.yaml
   ```

2. **Deploy infraestrutura global:**
   ```bash
   kubectl apply -f k8s/gatewayclass.yaml
   kubectl apply -f k8s/referencegrant.yaml
   kubectl apply -f k8s/namespaces.yaml
   ```

3. **Deploy ambientes:**
   ```bash
   # Homologação
   kubectl apply -f k8s/hml/

   # Produção
   kubectl apply -f k8s/prd/
   ```

4. **Verificar status:**
   ```bash
   kubectl get gateway -A
   kubectl get httproute -A
   kubectl get pods -n k8snode-hml
   kubectl get pods -n k8snode-prd
   ```

### 🌐 Acesso Público

Configure DNS para apontar para o IP do Gateway:

```bash
# Obter IP do Gateway
kubectl get gateway k8snode-gateway -n k8snode-prd -o jsonpath='{.status.addresses[0].value}'
```

**Endpoints Disponíveis:**
- `https://yourdomain.com/health` - Health check
- `https://api.yourdomain.com/auth/login` - Autenticação
- `https://yourdomain.com/api/v1/*` - API versionada

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

The pipeline includes:

1. **Test & Lint**: Runs tests and code quality checks
2. **Build & Push**: Builds Docker image and pushes to ECR
3. **Deploy HML**: Automatic deployment to homologation (main branch) using Gateway API
4. **Deploy PRD**: Manual deployment to production (workflow_dispatch) using Gateway API
5. **Gateway Verification**: Validates Gateway API resources and connectivity
6. **Health Checks**: Verifies deployment success through Gateway endpoints
7. **Notifications**: Reports deployment status with Gateway information

### 🌟 Melhorias do Pipeline

- **Gateway API Integration**: Pipeline agora usa o script `deploy-gateway.sh` para deployment completo
- **Validação de Gateway**: Verifica status do Gateway e HTTPRoute após deployment
- **Health Checks Avançados**: Testa conectividade através do Gateway em vez de apenas o Service
- **Melhor Tratamento de Erros**: Variáveis de ambiente corrigidas entre jobs
- **Informações Detalhadas**: Notificações incluem URLs de acesso e próximos passos

### Required GitHub Secrets

```bash
AWS_ACCESS_KEY_ID       # AWS access key
AWS_SECRET_ACCESS_KEY   # AWS secret key
ECR_REGISTRY           # ECR registry URL (e.g., 123456789.dkr.ecr.us-east-1.amazonaws.com)
EKS_CLUSTER_NAME       # EKS cluster name
```

### Triggering Deployments

**Automatic HML deployment:**
```bash
git push origin main
```

**Manual PRD deployment:**
- Go to GitHub Actions
- Select "Deploy to AWS EKS" workflow
- Click "Run workflow"
- Select environment: "prd"

## 🔧 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `3000` | No |
| `JWT_SECRET` | JWT signing secret | - | Yes (production) |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` | No |
| `LOG_LEVEL` | Logging level | `info` | No |
| `CORS_ORIGIN` | CORS allowed origins | `*` | No |

## 📁 Project Structure

```
k8snode/
├── src/                    # Source code
│   ├── app.ts             # Main application
│   ├── types/             # TypeScript definitions
│   ├── config/            # Configuration and users
│   ├── utils/             # Utilities (logger)
│   └── routes/            # API routes
├── k8s/                   # Kubernetes manifests
│   ├── namespaces.yaml    # Namespaces definition
│   ├── hml/              # HML environment
│   └── prd/              # PRD environment
├── .github/workflows/     # GitHub Actions
├── Dockerfile            # Docker configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## 🔐 Security Features

- **Non-root container execution**: Runs as user `nodeapp:1001`
- **Security contexts**: Kubernetes security policies
- **Secret management**: JWT secrets stored in Kubernetes secrets
- **CORS protection**: Configurable CORS policies
- **Input validation**: Zod schema validation
- **Password hashing**: bcrypt with salt rounds
- **Security headers**: Helmet.js security headers

## 📊 Monitoring & Observability

- **Health checks**: Kubernetes liveness and readiness probes
- **Structured logging**: JSON formatted logs with request tracing
- **Metrics**: Memory usage and system uptime in health endpoint
- **Auto-scaling**: HPA based on CPU and memory utilization
- **Request tracking**: Unique request IDs for tracing

## 🔄 Auto-scaling Configuration

### HML Environment
- **Min replicas**: 2
- **Max replicas**: 5
- **CPU threshold**: 70%
- **Memory threshold**: 80%

### PRD Environment
- **Min replicas**: 3
- **Max replicas**: 10
- **CPU threshold**: 70%
- **Memory threshold**: 80%

## 🐛 Troubleshooting

### Common Issues

1. **Build failures:**
   ```bash
   npm run clean
   npm install
   npm run build
   ```

2. **Docker build issues:**
   ```bash
   docker system prune
   docker build --no-cache -t k8snode-api .
   ```

3. **Kubernetes deployment failures:**
   ```bash
   kubectl describe pod <pod-name> -n k8snode-hml
   kubectl logs <pod-name> -n k8snode-hml
   ```

4. **Health check failures:**
   ```bash
   kubectl port-forward svc/k8snode-api-service 3000:80 -n k8snode-hml
   curl http://localhost:3000/health
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Check the troubleshooting section
- Review the logs using `kubectl logs`

---

**Built with ❤️ using TypeScript, Hono.js, and Kubernetes**