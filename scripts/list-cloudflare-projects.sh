#!/bin/bash

# Script to list your Cloudflare Pages projects
# Usage: ./scripts/list-cloudflare-projects.sh

# Check if CLOUDFLARE_API_TOKEN is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ Error: CLOUDFLARE_API_TOKEN environment variable is not set"
    echo ""
    echo "Usage:"
    echo "  export CLOUDFLARE_API_TOKEN=acYWHSbryBs5_9TmuzEHpGckm5Q7f-hgvIB-oKRp"
    echo "  ./scripts/list-cloudflare-projects.sh"
    exit 1
fi

echo "📋 Listing your Cloudflare Pages projects..."
echo ""

npx wrangler pages project list

echo ""
echo "✅ Done! Use one of the project names above as CLOUDFLARE_PROJECT_NAME"

