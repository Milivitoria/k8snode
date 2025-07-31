#!/bin/bash

# Deploy script for k8snode with Gateway API
# Usage: ./deploy-gateway.sh [hml|prd|all]

set -e

ENVIRONMENT=${1:-all}
NAMESPACE_HML="k8snode-hml"
NAMESPACE_PRD="k8snode-prd"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed or not in PATH"
    fi
    
    # Check if cluster is accessible
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster"
    fi
    
    # Check if Gateway API CRDs are installed
    if ! kubectl get crd gateways.gateway.networking.k8s.io &> /dev/null; then
        warn "Gateway API CRDs not found. Installing..."
        kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.0.0/standard-install.yaml
        log "Gateway API CRDs installed"
    fi
    
    log "Prerequisites check passed ✓"
}

deploy_global_resources() {
    log "Deploying global resources..."
    
    kubectl apply -f k8s/gatewayclass.yaml
    kubectl apply -f k8s/referencegrant.yaml
    kubectl apply -f k8s/namespaces.yaml
    
    log "Global resources deployed ✓"
}

deploy_environment() {
    local env=$1
    local namespace=$2
    
    log "Deploying $env environment to namespace $namespace..."
    
    # Deploy base resources
    kubectl apply -f k8s/$env/configmap.yaml
    kubectl apply -f k8s/$env/secret.yaml
    kubectl apply -f k8s/$env/service.yaml
    kubectl apply -f k8s/$env/deployment.yaml
    
    # Wait for deployment to be ready
    log "Waiting for deployment to be ready..."
    kubectl rollout status deployment/k8snode-api -n $namespace --timeout=300s
    
    # Deploy Gateway API resources
    kubectl apply -f k8s/$env/gateway.yaml
    kubectl apply -f k8s/$env/httproute.yaml
    kubectl apply -f k8s/$env/gateway-policies.yaml
    
    # Deploy HPA if exists
    if [ -f "k8s/$env/hpa.yaml" ]; then
        kubectl apply -f k8s/$env/hpa.yaml
    fi
    
    log "$env environment deployed ✓"
}

wait_for_gateway() {
    local env=$1
    local namespace=$2
    
    log "Waiting for Gateway to be ready in $env..."
    
    local retries=30
    local count=0
    
    while [ $count -lt $retries ]; do
        local status=$(kubectl get gateway k8snode-gateway -n $namespace -o jsonpath='{.status.conditions[?(@.type=="Programmed")].status}' 2>/dev/null || echo "")
        
        if [ "$status" = "True" ]; then
            log "Gateway is ready in $env ✓"
            
            # Get Gateway IP
            local gateway_ip=$(kubectl get gateway k8snode-gateway -n $namespace -o jsonpath='{.status.addresses[0].value}' 2>/dev/null || echo "")
            if [ -n "$gateway_ip" ]; then
                log "Gateway IP for $env: $gateway_ip"
            fi
            
            return 0
        fi
        
        echo -n "."
        sleep 10
        count=$((count + 1))
    done
    
    warn "Gateway not ready after $((retries * 10)) seconds in $env"
    return 1
}

verify_deployment() {
    local env=$1
    local namespace=$2
    
    log "Verifying deployment for $env..."
    
    # Check pods
    local ready_pods=$(kubectl get pods -n $namespace -l app=k8snode-api -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -o "True" | wc -l)
    local total_pods=$(kubectl get pods -n $namespace -l app=k8snode-api --no-headers | wc -l)
    
    log "Pods ready: $ready_pods/$total_pods"
    
    # Check Gateway
    local gateway_status=$(kubectl get gateway k8snode-gateway -n $namespace -o jsonpath='{.status.conditions[?(@.type=="Programmed")].status}' 2>/dev/null || echo "Unknown")
    log "Gateway status: $gateway_status"
    
    # Check HTTPRoute
    local route_status=$(kubectl get httproute k8snode-http-route -n $namespace -o jsonpath='{.status.conditions[?(@.type=="Accepted")].status}' 2>/dev/null || echo "Unknown")
    log "HTTPRoute status: $route_status"
    
    # Check service
    local service_ip=$(kubectl get service k8snode-api-service -n $namespace -o jsonpath='{.spec.clusterIP}')
    log "Service ClusterIP: $service_ip"
}

show_access_info() {
    log "Access Information:"
    echo ""
    echo -e "${BLUE}Homologação:${NC}"
    echo "  - https://hml.yourdomain.com"
    echo "  - https://api-hml.yourdomain.com"
    echo ""
    echo -e "${BLUE}Produção:${NC}"
    echo "  - https://yourdomain.com"
    echo "  - https://api.yourdomain.com"
    echo ""
    echo -e "${YELLOW}Configure seus registros DNS para apontar para os IPs dos Gateways acima.${NC}"
}

main() {
    log "Starting k8snode deployment with Gateway API"
    log "Environment: $ENVIRONMENT"
    
    check_prerequisites
    deploy_global_resources
    
    case $ENVIRONMENT in
        "hml")
            deploy_environment "hml" "$NAMESPACE_HML"
            wait_for_gateway "hml" "$NAMESPACE_HML"
            verify_deployment "hml" "$NAMESPACE_HML"
            ;;
        "prd")
            deploy_environment "prd" "$NAMESPACE_PRD"
            wait_for_gateway "prd" "$NAMESPACE_PRD"
            verify_deployment "prd" "$NAMESPACE_PRD"
            ;;
        "all")
            deploy_environment "hml" "$NAMESPACE_HML"
            deploy_environment "prd" "$NAMESPACE_PRD"
            wait_for_gateway "hml" "$NAMESPACE_HML"
            wait_for_gateway "prd" "$NAMESPACE_PRD"
            verify_deployment "hml" "$NAMESPACE_HML"
            verify_deployment "prd" "$NAMESPACE_PRD"
            ;;
        *)
            error "Invalid environment. Use: hml, prd, or all"
            ;;
    esac
    
    show_access_info
    log "Deployment completed successfully! 🚀"
}

# Run main function
main
