#!/bin/bash

# CI/CD Setup Verification Script
# This script validates that the CI/CD pipeline is properly configured

set -e

echo "=================================="
echo "CI/CD Setup Verification"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Check functions
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $1 is missing"
        ((FAILED++))
        return 1
    fi
}

check_script() {
    if grep -q "\"$1\":" package.json; then
        echo -e "${GREEN}✓${NC} npm script '$1' exists"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} npm script '$1' is missing"
        ((FAILED++))
        return 1
    fi
}

check_workflow_syntax() {
    if grep -q "name: CI/CD Pipeline" .github/workflows/ci.yml; then
        echo -e "${GREEN}✓${NC} Workflow has correct name"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Workflow name is incorrect"
        ((FAILED++))
    fi
    
    if grep -q "workflow_dispatch:" .github/workflows/ci.yml; then
        echo -e "${GREEN}✓${NC} Manual trigger configured"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Manual trigger missing"
        ((FAILED++))
    fi
    
    if grep -q "branches:" .github/workflows/ci.yml && grep -q "\- master" .github/workflows/ci.yml; then
        echo -e "${GREEN}✓${NC} Auto-trigger on master configured"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Auto-trigger on master missing"
        ((FAILED++))
    fi
}

# Start checks
echo "1. Checking workflow files..."
check_file ".github/workflows/ci.yml"
echo ""

echo "2. Checking documentation files..."
check_file ".github/workflows/README.md"
check_file ".github/workflows/CI_CD_README.md"
check_file ".github/workflows/WORKFLOW_DIAGRAM.md"
check_file ".github/workflows/VALIDATION_CHECKLIST.md"
check_file "CI_CD_QUICK_START.md"
check_file "CI_CD_SETUP_SUMMARY.md"
echo ""

echo "3. Checking configuration files..."
check_file ".nvmrc"
check_file "package.json"
check_file "vitest.config.ts"
check_file "playwright.config.ts"
echo ""

echo "4. Checking npm scripts..."
check_script "lint"
check_script "test"
check_script "test:coverage"
check_script "test:e2e"
check_script "build"
echo ""

echo "5. Checking workflow configuration..."
check_workflow_syntax
echo ""

echo "6. Checking Node.js version..."
if [ -f ".nvmrc" ]; then
    NODE_VERSION=$(cat .nvmrc)
    if [ "$NODE_VERSION" = "22.14.0" ]; then
        echo -e "${GREEN}✓${NC} Node.js version is correct (22.14.0)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} Node.js version is $NODE_VERSION (expected 22.14.0)"
        ((WARNINGS++))
    fi
fi
echo ""

echo "7. Checking Git branch..."
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
if [ "$CURRENT_BRANCH" = "master" ]; then
    echo -e "${GREEN}✓${NC} On master branch"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Current branch: $CURRENT_BRANCH (workflow triggers on master)"
    ((WARNINGS++))
fi
echo ""

# Summary
echo "=================================="
echo "Verification Summary"
echo "=================================="
echo -e "${GREEN}Passed:${NC}   $PASSED"
echo -e "${RED}Failed:${NC}   $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ CI/CD pipeline is properly configured!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. git add ."
    echo "2. git commit -m 'feat: Add CI/CD pipeline'"
    echo "3. git push origin master"
    echo "4. Visit GitHub Actions to see the workflow run"
    echo ""
    exit 0
else
    echo -e "${RED}✗ CI/CD pipeline has configuration issues${NC}"
    echo ""
    echo "Please fix the failed checks above and try again."
    echo ""
    exit 1
fi

