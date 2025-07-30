# K8sNode API

A production-ready Node.js API built with TypeScript, Hono.js, and deployed on AWS EKS with Kubernetes.

## 🚀 Features

- **Modern Stack**: Node.js 18+ with TypeScript, Hono.js framework
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Health Monitoring**: Comprehensive health checks with system metrics
- **Structured Logging**: JSON-structured logs for better observability
- **Container Ready**: Multi-stage Docker build optimized for production
- **Kubernetes Native**: Complete K8s manifests with auto-scaling
- **CI/CD Pipeline**: GitHub Actions for automated AWS EKS deployment
- **Security**: Non-root containers, security contexts, and secrets management

## 📋 API Endpoints

### GET /health
Returns system health information and metrics.

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
Authenticates users and returns JWT token.

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

## 🏗️ Project Structure

```
k8snode/
├── src/
│   ├── app.ts              # Main application
│   ├── types/index.ts      # TypeScript definitions
│   ├── config/index.ts     # Configuration and users
│   ├── utils/logger.ts     # Structured logging
│   └── routes/
│       ├── health.ts       # Health endpoint
│       └── auth.ts         # Authentication endpoint
├── k8s/
│   ├── namespaces.yaml     # Kubernetes namespaces
│   ├── hml/                # Homologation environment
│   │   ├── configmap.yaml
│   │   ├── secret.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── hpa.yaml
│   └── prd/                # Production environment
│       ├── configmap.yaml
│       ├── secret.yaml
│       ├── deployment.yaml
│       ├── service.yaml
│       └── hpa.yaml
├── .github/workflows/
│   └── deploy.yml          # CI/CD pipeline
├── Dockerfile              # Multi-stage container build
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker (for containerization)
- kubectl (for Kubernetes deployment)
- AWS CLI (for EKS deployment)

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

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key-change-in-production` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `*` |

### Pre-configured Users

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Administrator |
| `user` | `user123` | User |

> **Note**: In production, users should be stored in a database with proper user management.

## 🐳 Docker

### Build Container

```bash
docker build -t k8snode:latest .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret \
  k8snode:latest
```

### Security Features

- Non-root user (nodeapp:1001)
- Multi-stage build for smaller images
- Health checks included
- Dumb-init for proper signal handling

## ☸️ Kubernetes Deployment

### Environments

#### HML (Homologation)
- **Namespace**: `k8snode-hml`
- **Replicas**: 2-5 (auto-scaling)
- **Resources**: 100m CPU / 128Mi RAM (request)
- **Limits**: 500m CPU / 512Mi RAM
- **Deployment**: Automatic on `main` branch push

#### PRD (Production)
- **Namespace**: `k8snode-prd`
- **Replicas**: 3-10 (auto-scaling)
- **Resources**: 200m CPU / 256Mi RAM (request)
- **Limits**: 1000m CPU / 1Gi RAM
- **Deployment**: Manual via workflow dispatch

### Manual Deployment

1. **Create namespaces:**
   ```bash
   kubectl apply -f k8s/namespaces.yaml
   ```

2. **Deploy to HML:**
   ```bash
   kubectl apply -f k8s/hml/
   ```

3. **Deploy to PRD:**
   ```bash
   kubectl apply -f k8s/prd/
   ```

### Monitoring

```bash
# Check pods
kubectl get pods -n k8snode-hml
kubectl get pods -n k8snode-prd

# Check services
kubectl get services -n k8snode-hml
kubectl get services -n k8snode-prd

# Check HPA status
kubectl get hpa -n k8snode-hml
kubectl get hpa -n k8snode-prd

# View logs
kubectl logs -n k8snode-hml deployment/k8snode-deployment
```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

The pipeline includes:

1. **Test & Lint**: Runs tests and linting
2. **Build & Push**: Builds Docker image and pushes to ECR
3. **Deploy HML**: Automatic deployment on `main` branch
4. **Deploy PRD**: Manual deployment via workflow dispatch

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for ECR and EKS |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for ECR and EKS |

### AWS Setup

1. **Create ECR Repository:**
   ```bash
   aws ecr create-repository --repository-name k8snode --region us-east-1
   ```

2. **Create EKS Cluster:**
   ```bash
   eksctl create cluster --name your-eks-cluster --region us-east-1
   ```

3. **Update Workflow Variables:**
   - Replace `YOUR_ECR_REGISTRY` with your ECR registry URL
   - Update `EKS_CLUSTER_NAME` with your cluster name
   - Adjust `AWS_REGION` as needed

### Deployment Commands

**Automatic HML Deployment:**
```bash
git push origin main
```

**Manual PRD Deployment:**
1. Go to GitHub Actions
2. Select "Deploy to AWS EKS" workflow
3. Click "Run workflow"
4. Select environment: `prd`
5. Click "Run workflow"

## 🔒 Security

### Container Security
- Non-root user execution
- Read-only root filesystem (where applicable)
- Dropped capabilities
- Security contexts configured

### Kubernetes Security
- Network policies (implement as needed)
- Pod security contexts
- Secrets for sensitive data
- Resource limits and requests

### Application Security
- JWT token authentication
- Password hashing with bcrypt
- Input validation with Zod
- CORS configuration
- Structured error handling

## 📊 Monitoring & Observability

### Health Checks
- Kubernetes liveness probes
- Kubernetes readiness probes
- Custom health endpoint with metrics

### Logging
- Structured JSON logs
- Request/response logging
- Error tracking
- Performance metrics

### Metrics Available
- Response times
- Memory usage
- CPU utilization
- Request counts
- Error rates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Milivitoria/k8snode/issues) page
2. Create a new issue with detailed information
3. Include logs and error messages when applicable

## 🔄 Changelog

### v1.0.0
- Initial release
- Node.js API with TypeScript and Hono.js
- JWT authentication
- Health monitoring
- Kubernetes deployment manifests
- GitHub Actions CI/CD pipeline
- Comprehensive documentation