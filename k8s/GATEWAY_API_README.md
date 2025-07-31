# Gateway API para k8snode

## 🚀 Visão Geral

A **Gateway API** é a evolução do Ingress no Kubernetes, oferecendo recursos mais avançados e flexibilidade. Esta implementação substitui os Ingress tradicionais por uma arquitetura mais robusta.

## 📁 Arquivos Criados

### 🏗️ **Infraestrutura Global:**
- `k8s/gatewayclass.yaml` - Classe de Gateway com NGINX Controller
- `k8s/referencegrant.yaml` - Permissões cross-namespace

### 🧪 **Ambiente de Homologação:**
- `k8s/hml/gateway.yaml` - Gateway principal para HML
- `k8s/hml/httproute.yaml` - Rotas HTTP com filtros
- `k8s/hml/gateway-policies.yaml` - Políticas de timeout

### 🏭 **Ambiente de Produção:**
- `k8s/prd/gateway.yaml` - Gateway principal para PRD
- `k8s/prd/httproute.yaml` - Rotas HTTP com segurança avançada
- `k8s/prd/gateway-policies.yaml` - Políticas e timeouts

## 🌟 Recursos Implementados

### 🔒 **Segurança Avançada:**
- **SSL/TLS automático** com cert-manager
- **Redirecionamento HTTP → HTTPS** obrigatório
- **Headers de segurança** (HSTS, X-Frame-Options, etc.)
- **Rate limiting** por ambiente

### 🛠️ **Roteamento Inteligente:**
- **Path-based routing** (`/health`, `/auth`, `/api/v1`)
- **URL rewriting** para versionamento de API
- **Header manipulation** (request/response)
- **Filtros personalizados** por rota

### ⚡ **Performance & Observabilidade:**
- **Timeouts configuráveis** por ambiente
- **Telemetria integrada** com tracing
- **Logging estruturado**
- **Métricas automáticas**

## 🏗️ Pré-requisitos

### 1. **Instalar Gateway API CRDs:**
```bash
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.0.0/standard-install.yaml
```

### 2. **NGINX Gateway Fabric:**
```bash
# Instalar NGINX Gateway Fabric
kubectl apply -f https://raw.githubusercontent.com/nginxinc/nginx-gateway-fabric/v1.1.0/deploy/crds.yaml
kubectl apply -f https://raw.githubusercontent.com/nginxinc/nginx-gateway-fabric/v1.1.0/deploy/nginx-gateway.yaml
```

### 3. **Cert-Manager:**
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.4/cert-manager.yaml
```

### 4. **ClusterIssuer:**
```bash
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: seu-email@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        gatewayHTTPRoute:
          parentRefs:
          - name: k8snode-gateway
            namespace: k8snode-prd
            sectionName: http
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: seu-email@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - http01:
        gatewayHTTPRoute:
          parentRefs:
          - name: k8snode-gateway
            namespace: k8snode-hml
            sectionName: http
EOF
```

## 🚀 Deploy

### **Ordem de Deploy:**
```bash
# 1. CRDs e infraestrutura global
kubectl apply -f k8s/gatewayclass.yaml
kubectl apply -f k8s/referencegrant.yaml

# 2. Namespaces
kubectl apply -f k8s/namespaces.yaml

# 3. Aplicação base
kubectl apply -f k8s/hml/configmap.yaml
kubectl apply -f k8s/hml/secret.yaml
kubectl apply -f k8s/hml/service.yaml
kubectl apply -f k8s/hml/deployment.yaml

kubectl apply -f k8s/prd/configmap.yaml
kubectl apply -f k8s/prd/secret.yaml
kubectl apply -f k8s/prd/service.yaml
kubectl apply -f k8s/prd/deployment.yaml

# 4. Gateway API
kubectl apply -f k8s/hml/gateway.yaml
kubectl apply -f k8s/hml/httproute.yaml
kubectl apply -f k8s/hml/gateway-policies.yaml

kubectl apply -f k8s/prd/gateway.yaml
kubectl apply -f k8s/prd/httproute.yaml
kubectl apply -f k8s/prd/gateway-policies.yaml

# 5. HPA (opcional)
kubectl apply -f k8s/hml/hpa.yaml
kubectl apply -f k8s/prd/hpa.yaml
```

## 🔍 Verificação

### **Status dos Gateways:**
```bash
kubectl get gateway -A
kubectl get httproute -A
kubectl get gatewayclass
```

### **Logs do Controller:**
```bash
kubectl logs -n nginx-gateway deployment/nginx-gateway -f
```

### **Certificados SSL:**
```bash
kubectl get certificates -A
kubectl describe certificate k8snode-gateway-tls-prd -n k8snode-prd
```

## 🌐 Configuração DNS

Configure os seguintes registros DNS:

### **Produção:**
- `yourdomain.com` → IP do Gateway
- `api.yourdomain.com` → IP do Gateway

### **Homologação:**
- `hml.yourdomain.com` → IP do Gateway  
- `api-hml.yourdomain.com` → IP do Gateway

### **Obter IP do Gateway:**
```bash
kubectl get gateway k8snode-gateway -n k8snode-prd -o jsonpath='{.status.addresses[0].value}'
```

## 🧪 Testes

### **Health Check:**
```bash
curl -I https://yourdomain.com/health
curl -I https://hml.yourdomain.com/health
```

### **Autenticação:**
```bash
curl -X POST https://api.yourdomain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### **API Versionada:**
```bash
curl https://yourdomain.com/api/v1/health
# Será reescrito para https://yourdomain.com/health
```

## 🆚 Gateway API vs Ingress

| Recurso | Ingress | Gateway API |
|---------|---------|-------------|
| **Roteamento** | Básico | Avançado |
| **Filtros** | Limitado | Extensivo |
| **Observabilidade** | Básica | Nativa |
| **Cross-namespace** | Não | Sim |
| **Políticas** | Via annotations | Recursos dedicados |
| **Extensibilidade** | Limitada | Alta |

## 🛠️ Troubleshooting

### **Gateway não está Ready:**
```bash
kubectl describe gateway k8snode-gateway -n k8snode-prd
```

### **HTTPRoute não funciona:**
```bash
kubectl describe httproute k8snode-http-route -n k8snode-prd
```

### **Certificado SSL pendente:**
```bash
kubectl describe certificate k8snode-gateway-tls-prd -n k8snode-prd
kubectl logs -n cert-manager deployment/cert-manager
```

## 🎯 Próximos Passos

1. **Implementar rate limiting** com políticas dedicadas
2. **Adicionar circuit breaker** para resiliência
3. **Configurar observabilidade** com Prometheus/Grafana
4. **Implementar canary deployments** com traffic splitting

---

**🚀 Agora você tem uma infraestrutura moderna e robusta com Gateway API!**
