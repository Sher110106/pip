#!/bin/bash

# Setup script for GitHub Integration with Python Dependency Resolver
# This script helps you configure GitHub App integration quickly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup function
main() {
    print_header "Python Dependency Resolver - GitHub Integration Setup"
    
    echo "This script will help you set up GitHub integration for your"
    echo "Python Dependency Resolver. You'll need:"
    echo "  • A GitHub account with admin access to repositories"
    echo "  • Your deployed Cloudflare Worker URL"
    echo "  • GitHub CLI (optional, for easier setup)"
    echo ""
    
    read -p "Continue with setup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Get configuration
    get_configuration
    
    # Create GitHub App
    create_github_app
    
    # Update environment variables
    update_env_vars
    
    # Setup workflow
    setup_workflow
    
    # Final instructions
    final_instructions
}

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if we're in the right directory
    if [[ ! -f "package.json" ]] || ! grep -q "python-dependency-resolver" package.json; then
        print_error "Please run this script from the Python Dependency Resolver project root"
        exit 1
    fi
    
    print_success "Found Python Dependency Resolver project"
    
    # Check for required files
    if [[ ! -f ".dev.vars.example" ]]; then
        print_error "Missing .dev.vars.example file"
        exit 1
    fi
    
    # Check if GitHub CLI is available
    if command_exists gh; then
        print_success "GitHub CLI found"
        GH_CLI_AVAILABLE=true
        
        # Check if user is logged in
        if gh auth status >/dev/null 2>&1; then
            print_success "GitHub CLI authenticated"
        else
            print_warning "GitHub CLI not authenticated. Run 'gh auth login' first"
            GH_CLI_AVAILABLE=false
        fi
    else
        print_warning "GitHub CLI not found. Manual setup will be required"
        GH_CLI_AVAILABLE=false
    fi
    
    # Check for wrangler
    if command_exists wrangler; then
        print_success "Wrangler found"
    else
        print_warning "Wrangler not found. Install with: npm install -g wrangler"
    fi
}

get_configuration() {
    print_header "Configuration"
    
    # Get worker URL
    echo "Enter your deployed Cloudflare Worker URL:"
    echo "Example: https://python-dependency-resolver.your-subdomain.workers.dev"
    read -p "Worker URL: " WORKER_URL
    
    if [[ ! $WORKER_URL =~ ^https?:// ]]; then
        print_error "Please enter a valid URL starting with http:// or https://"
        exit 1
    fi
    
    # Remove trailing slash
    WORKER_URL=${WORKER_URL%/}
    
    # Get app name
    read -p "GitHub App name [Python Dependency Resolver]: " APP_NAME
    APP_NAME=${APP_NAME:-"Python Dependency Resolver"}
    
    # Generate webhook secret
    WEBHOOK_SECRET=$(openssl rand -hex 32)
    print_success "Generated webhook secret"
    
    print_info "Configuration ready:"
    echo "  • Worker URL: $WORKER_URL"
    echo "  • App Name: $APP_NAME"
    echo "  • Webhook Secret: [generated]"
}

create_github_app() {
    print_header "Creating GitHub App"
    
    if [[ $GH_CLI_AVAILABLE == true ]]; then
        create_app_with_cli
    else
        create_app_manual
    fi
}

create_app_with_cli() {
    print_info "Creating GitHub App with GitHub CLI..."
    
    # Create app manifest
    cat > /tmp/app-manifest.json << EOF
{
  "name": "$APP_NAME",
  "url": "$WORKER_URL",
  "hook_attributes": {
    "url": "$WORKER_URL/api/webhooks/github"
  },
  "redirect_url": "$WORKER_URL",
  "callback_urls": [
    "$WORKER_URL"
  ],
  "public": false,
  "default_permissions": {
    "contents": "read",
    "issues": "write",
    "pull_requests": "write",
    "checks": "write"
  },
  "default_events": [
    "push",
    "pull_request",
    "installation",
    "installation_repositories"
  ]
}
EOF

    # Note: GitHub CLI doesn't have direct app creation, so we'll provide instructions
    print_warning "GitHub CLI doesn't support app creation directly."
    print_info "Please create the app manually using the instructions below."
    create_app_manual
}

create_app_manual() {
    print_info "Manual GitHub App creation required."
    echo ""
    echo "1. Go to: https://github.com/settings/apps/new"
    echo "   (Or for organizations: https://github.com/organizations/YOUR_ORG/settings/apps/new)"
    echo ""
    echo "2. Fill in these details:"
    echo "   • GitHub App name: $APP_NAME"
    echo "   • Description: AI-powered Python dependency analysis"
    echo "   • Homepage URL: $WORKER_URL"
    echo "   • Webhook URL: $WORKER_URL/api/webhooks/github"
    echo "   • Webhook secret: $WEBHOOK_SECRET"
    echo ""
    echo "3. Set these permissions:"
    echo "   • Repository permissions:"
    echo "     - Contents: Read"
    echo "     - Issues: Write"
    echo "     - Pull requests: Write"
    echo "     - Checks: Write"
    echo ""
    echo "4. Subscribe to these events:"
    echo "   • Push"
    echo "   • Pull request"
    echo "   • Installation"
    echo "   • Installation repositories"
    echo ""
    echo "5. Create the app and note down:"
    echo "   • App ID"
    echo "   • Generate and download private key"
    echo ""
    
    read -p "Press Enter after creating the GitHub App..."
    
    # Get app details
    read -p "Enter your GitHub App ID: " APP_ID
    
    echo ""
    echo "Please paste your private key (press Ctrl+D when done):"
    PRIVATE_KEY=$(cat)
    
    if [[ -z "$APP_ID" ]] || [[ -z "$PRIVATE_KEY" ]]; then
        print_error "App ID or private key cannot be empty"
        exit 1
    fi
    
    print_success "GitHub App configuration collected"
}

update_env_vars() {
    print_header "Updating Environment Variables"
    
    # Create .dev.vars from example if it doesn't exist
    if [[ ! -f ".dev.vars" ]]; then
        cp .dev.vars.example .dev.vars
        print_success "Created .dev.vars from example"
    fi
    
    # Update .dev.vars with GitHub configuration
    print_info "Updating .dev.vars with GitHub App configuration..."
    
    # Remove existing GitHub config if any
    sed -i '/^GITHUB_/d' .dev.vars 2>/dev/null || true
    sed -i '/^BASE_URL/d' .dev.vars 2>/dev/null || true
    
    # Add new configuration
    cat >> .dev.vars << EOF

# GitHub App Configuration (added by setup script)
GITHUB_APP_ID=$APP_ID
GITHUB_WEBHOOK_SECRET=$WEBHOOK_SECRET
BASE_URL=$WORKER_URL
GITHUB_PRIVATE_KEY="$PRIVATE_KEY"
EOF
    
    print_success "Updated .dev.vars with GitHub configuration"
    print_warning "Remember to add these variables to your Cloudflare Worker secrets!"
}

setup_workflow() {
    print_header "Setting Up GitHub Actions Workflow"
    
    # Create .github/workflows directory if it doesn't exist
    mkdir -p .github/workflows
    
    # Check if workflow already exists
    if [[ -f ".github/workflows/dependency-check.yml" ]]; then
        print_info "GitHub Actions workflow already exists"
        read -p "Overwrite existing workflow? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Skipping workflow setup"
            return
        fi
    fi
    
    # Update the workflow template with the correct URL
    if [[ -f ".github/workflows/dependency-check.yml" ]]; then
        sed -i "s|https://python-dependency-resolver.example.workers.dev|$WORKER_URL|g" .github/workflows/dependency-check.yml
        print_success "Updated workflow with your Worker URL"
    else
        print_warning "Workflow template not found. Please create it manually."
    fi
}

final_instructions() {
    print_header "Setup Complete!"
    
    print_success "GitHub integration has been configured"
    
    echo ""
    print_info "Next steps:"
    echo ""
    echo "1. Deploy your worker with the new configuration:"
    echo "   wrangler secret put GITHUB_APP_ID"
    echo "   wrangler secret put GITHUB_WEBHOOK_SECRET"
    echo "   wrangler secret put GITHUB_PRIVATE_KEY"
    echo "   npm run deploy"
    echo ""
    echo "2. Install your GitHub App on repositories:"
    echo "   • Go to your app's settings page"
    echo "   • Click 'Install App'"
    echo "   • Choose repositories to analyze"
    echo ""
    echo "3. Test the integration:"
    echo "   • Create a PR with requirements.txt changes"
    echo "   • Watch for automated analysis comments"
    echo ""
    echo "4. Optional - Enable GitHub Actions:"
    echo "   • Commit the workflow to your repositories"
    echo "   • Configure repository permissions"
    echo ""
    
    print_info "Configuration files updated:"
    echo "  • .dev.vars (GitHub App credentials)"
    echo "  • .github/workflows/dependency-check.yml (GitHub Actions)"
    echo ""
    
    print_warning "Security reminders:"
    echo "  • Never commit .dev.vars to version control"
    echo "  • Store secrets securely in Cloudflare Workers"
    echo "  • Regularly rotate your webhook secret"
    echo ""
    
    print_success "Happy dependency analyzing! 🐍"
}

# Run main function
main "$@" 