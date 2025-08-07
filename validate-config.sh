#!/bin/bash

# Validation script for k8snode Gateway API configuration
# Usage: ./validate-config.sh [hml|prd|all]

set -e

ENVIRONMENT=${1:-all}

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
}

check_yaml_syntax() {
    local file=$1
    log "Checking YAML syntax: $file"
    
    if command -v yq &> /dev/null; then
        yq eval . "$file" > /dev/null 2>&1 || {
            error "Invalid YAML syntax in $file"
            return 1
        }
    else
        # Fallback to python if yq not available
        python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null || {
            error "Invalid YAML syntax in $file"
            return 1
        }
    fi
}

validate_kubernetes_resources() {
    local env=$1
    log "Validating Kubernetes resources for $env environment..."
    
    local files=(
        "k8s/gatewayclass.yaml"
        "k8s/referencegrant.yaml"
        "k8s/namespaces.yaml"
        "k8s/$env/configmap.yaml"
        "k8s/$env/secret.yaml"
        "k8s/$env/service.yaml"
        "k8s/$env/deployment.yaml"
        "k8s/$env/gateway.yaml"
        "k8s/$env/httproute.yaml"
        "k8s/$env/gateway-policies.yaml"
    )
    
    if [ -f "k8s/$env/hpa.yaml" ]; then
        files+=("k8s/$env/hpa.yaml")
    fi
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            check_yaml_syntax "$file"
        else
            warn "File not found: $file"
        fi
    done
}

validate_environment_config() {
    local env=$1
    log "Validating environment configuration for $env..."
    
    # Check if deployment has proper image reference
    if grep -q "YOUR_ECR_REGISTRY" "k8s/$env/deployment.yaml"; then
        warn "Deployment still contains placeholder ECR registry in $env"
    fi
    
    # Check Gateway hostnames
    local gateway_file="k8s/$env/gateway.yaml"
    if [ -f "$gateway_file" ]; then
        if grep -q "yourdomain.com" "$gateway_file"; then
            warn "Gateway contains placeholder domain in $env - update before production use"
        fi
    fi
    
    # Check HTTPRoute hostnames
    local httproute_file="k8s/$env/httproute.yaml"
    if [ -f "$httproute_file" ]; then
        if grep -q "yourdomain.com" "$httproute_file"; then
            warn "HTTPRoute contains placeholder domain in $env - update before production use"
        fi
    fi
}

validate_application() {
    log "Validating application configuration..."
    
    # Check if Node.js app builds
    if [ -f "package.json" ]; then
        log "Checking package.json..."
        if command -v npm &> /dev/null; then
            npm run build > /dev/null 2>&1 || warn "npm build failed"
        fi
    fi
    
    # Check Dockerfile
    if [ -f "Dockerfile" ]; then
        log "Dockerfile found - OK"
    else
        error "Dockerfile not found"
    fi
    
    # Check deployment script
    if [ -f "deploy-gateway.sh" ] && [ -x "deploy-gateway.sh" ]; then
        log "Deployment script found and executable - OK"
    else
        error "deploy-gateway.sh not found or not executable"
    fi
}

validate_ci_cd() {
    log "Validating CI/CD configuration..."
    
    local workflow_file=".github/workflows/deploy.yml"
    if [ -f "$workflow_file" ]; then
        check_yaml_syntax "$workflow_file"
        
        # Check if workflow uses Gateway API deployment
        if grep -q "deploy-gateway.sh" "$workflow_file"; then
            log "CI/CD pipeline uses Gateway API deployment - OK"
        else
            warn "CI/CD pipeline may not be using Gateway API deployment script"
        fi
    else
        warn "GitHub Actions workflow not found"
    fi
}

main() {
    log "Starting configuration validation for k8snode"
    log "Environment: $ENVIRONMENT"
    
    local validation_errors=0
    
    # Validate application
    validate_application || validation_errors=$((validation_errors + 1))
    
    # Validate environments
    case $ENVIRONMENT in
        "hml")
            validate_kubernetes_resources "hml" || validation_errors=$((validation_errors + 1))
            validate_environment_config "hml" || validation_errors=$((validation_errors + 1))
            ;;
        "prd")
            validate_kubernetes_resources "prd" || validation_errors=$((validation_errors + 1))
            validate_environment_config "prd" || validation_errors=$((validation_errors + 1))
            ;;
        "all")
            validate_kubernetes_resources "hml" || validation_errors=$((validation_errors + 1))
            validate_environment_config "hml" || validation_errors=$((validation_errors + 1))
            validate_kubernetes_resources "prd" || validation_errors=$((validation_errors + 1))
            validate_environment_config "prd" || validation_errors=$((validation_errors + 1))
            ;;
        *)
            error "Invalid environment. Use: hml, prd, or all"
            exit 1
            ;;
    esac
    
    # Validate CI/CD
    validate_ci_cd || validation_errors=$((validation_errors + 1))
    
    if [ $validation_errors -eq 0 ]; then
        log "🎉 All validations passed successfully!"
        log "Configuration is ready for deployment"
    else
        warn "⚠️ Some validations found issues - please review warnings above"
    fi
    
    echo ""
    log "Next steps:"
    echo "  1. Update domain placeholders with real domains"
    echo "  2. Update ECR registry in CI/CD secrets"
    echo "  3. Run: ./deploy-gateway.sh $ENVIRONMENT"
    echo "  4. Verify Gateway status: kubectl get gateway -A"
}

# Run main function
main