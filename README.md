# K8s Node API

A complete Node.js API built with TypeScript and Hono.js framework, designed for Kubernetes deployment on AWS EKS with automated CI/CD pipeline.

## 🚀 Features

- **Modern Stack**: Node.js 18+ with TypeScript and Hono.js framework
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Validation**: Request validation using Zod schemas
- **Logging**: Structured JSON logging system
- **Health Monitoring**: Comprehensive health endpoint with system metrics
- **Security**: CORS configuration, security contexts, and non-root container execution
- **Containerization**: Multi-stage Docker build for optimized production images
- **Kubernetes**: Complete K8s manifests for HML and PRD environments
- **Auto-scaling**: Horizontal Pod Autoscaler (HPA) based on CPU and memory
- **CI/CD**: GitHub Actions workflow for automated AWS EKS deployment

## 📋 API Endpoints

### GET /health
Returns system health and metrics information.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-30T02:52:34.000Z",
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

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker (for containerization)
- kubectl (for Kubernetes deployment)
- AWS CLI (for EKS deployment)

### Local Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd k8snode
```

2. **Install dependencies:**
```bash
npm install
```

3. **Environment variables:**
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-development-jwt-secret
JWT_EXPIRES_IN=24h
APP_VERSION=1.0.0
```

4. **Development server:**
```bash
npm run dev
```

5. **Build for production:**
```bash
npm run build
npm start
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm test` - Run tests
- `npm run clean` - Clean build directory

## 🐳 Docker

### Build Image
```bash
docker build -t k8snode-api .
```

### Run Container
```bash
docker run -p 3000:3000 -e JWT_SECRET=your-secret k8snode-api
```

### Health Check
The Docker image includes a health check that pings the `/health` endpoint every 30 seconds.

## ☸️ Kubernetes Deployment

### Environments

The application supports two environments:

- **HML (Homologation)**: 2-5 pods, automatic deployment on main branch
- **PRD (Production)**: 3-10 pods, manual deployment via workflow dispatch

### Prerequisites

1. **AWS EKS Cluster**: Set up an EKS cluster
2. **ECR Repository**: Create an ECR repository for the Docker images
3. **GitHub Secrets**: Configure the following secrets in your GitHub repository:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

### Configuration Updates Required

Before deploying, update the following in the workflow and manifests:

1. **ECR Registry**: Replace `YOUR_ECR_REGISTRY` in:
   - `.github/workflows/deploy.yml`
   - `k8s/hml/deployment.yaml`
   - `k8s/prd/deployment.yaml`

2. **EKS Cluster Name**: Update `EKS_CLUSTER_NAME` in `.github/workflows/deploy.yml`

3. **AWS Region**: Update `AWS_REGION` in `.github/workflows/deploy.yml` if needed

### Deploy to HML

HML deployment happens automatically when code is pushed to the `main` branch.

### Deploy to PRD

PRD deployment is manual and can be triggered via GitHub Actions:

1. Go to Actions tab in GitHub
2. Select "Deploy to AWS EKS" workflow
3. Click "Run workflow"
4. Select "prd" environment
5. Click "Run workflow"

### Manual Kubernetes Deployment

If you prefer manual deployment:

```bash
# Apply namespaces
kubectl apply -f k8s/namespaces.yaml

# Deploy to HML
kubectl apply -f k8s/hml/

# Deploy to PRD
kubectl apply -f k8s/prd/

# Check deployment status
kubectl get pods -n k8snode-hml
kubectl get pods -n k8snode-prd

# Get service URLs
kubectl get service k8snode-api-service -n k8snode-hml
kubectl get service k8snode-api-service -n k8snode-prd
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` |
| `APP_VERSION` | Application version | `1.0.0` |

### Default Users

The application comes with pre-configured users:

- **admin**: password `admin123`
- **user**: password `user123`

> ⚠️ **Security Note**: Change default passwords in production!

## 📊 Monitoring & Scaling

### Health Checks

- **Liveness Probe**: Checks if the application is running
- **Readiness Probe**: Checks if the application is ready to serve traffic
- **Docker Health Check**: Built-in container health monitoring

### Auto-scaling

The application uses Horizontal Pod Autoscaler (HPA) with the following configuration:

**HML Environment:**
- Min replicas: 2
- Max replicas: 5
- CPU threshold: 70%
- Memory threshold: 80%

**PRD Environment:**
- Min replicas: 3
- Max replicas: 10
- CPU threshold: 70%
- Memory threshold: 80%

### Resource Limits

**HML Environment:**
- Requests: 100m CPU, 128Mi RAM
- Limits: 500m CPU, 512Mi RAM

**PRD Environment:**
- Requests: 200m CPU, 256Mi RAM
- Limits: 1000m CPU, 1Gi RAM

## 🔒 Security

- **Non-root execution**: Container runs as user ID 1001
- **Read-only filesystem**: Container filesystem is read-only
- **No privilege escalation**: Security context prevents privilege escalation
- **JWT authentication**: Secure token-based authentication
- **CORS configuration**: Cross-origin resource sharing properly configured
- **Input validation**: All inputs validated using Zod schemas

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub        │    │   AWS ECR       │    │   AWS EKS       │
│   Repository    │───▶│   Container     │───▶│   Kubernetes    │
│                 │    │   Registry      │    │   Cluster       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────┐                          ┌─────────────────┐
│   GitHub        │                          │   Load Balancer │
│   Actions       │                          │   (NLB)         │
│   CI/CD         │                          │                 │
└─────────────────┘                          └─────────────────┘
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions, please open an issue in the GitHub repository.