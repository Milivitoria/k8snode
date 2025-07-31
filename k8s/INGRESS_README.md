# ⚠️ Ingress Depreciado - Use Gateway API

## 🔄 Migração Concluída

Os recursos de **Ingress foram removidos** e substituídos pela **Gateway API**, que oferece recursos mais avançados e é o futuro do roteamento no Kubernetes.

## 🚀 Use a Gateway API

Para configurar o acesso público à sua aplicação, consulte:

📖 **[Gateway API README](./GATEWAY_API_README.md)**

## 🗑️ Arquivos Removidos

- ~~`k8s/prd/ingress.yaml`~~ → Substituído por `k8s/prd/gateway.yaml` + `k8s/prd/httproute.yaml`
- ~~`k8s/hml/ingress.yaml`~~ → Substituído por `k8s/hml/gateway.yaml` + `k8s/hml/httproute.yaml`

## 🌟 Vantagens da Gateway API

| Recurso | Ingress | Gateway API |
|---------|---------|-------------|
| **Roteamento** | Básico | Avançado |
| **Filtros** | Limitado | Extensivo |
| **Observabilidade** | Básica | Nativa |
| **Cross-namespace** | Não | Sim |
| **Políticas** | Via annotations | Recursos dedicados |
| **Extensibilidade** | Limitada | Alta |

## 🚀 Deploy Rápido

```bash
# Deploy completo com Gateway API
./deploy-gateway.sh all
```

---

**⚡ Para uma experiência moderna e robusta, use a Gateway API!**
