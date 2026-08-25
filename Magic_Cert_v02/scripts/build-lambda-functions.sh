#!/bin/bash
# Build Lambda Functions Script

set -e

echo "🔨 Building Lambda Functions..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FUNCTIONS_DIR="$PROJECT_ROOT/backend/functions"

# Function to build a Lambda function
build_function() {
  local FUNCTION_NAME=$1
  local FUNCTION_DIR="$FUNCTIONS_DIR/$FUNCTION_NAME"
  
  echo ""
  echo "📦 Building $FUNCTION_NAME..."
  
  if [ ! -d "$FUNCTION_DIR" ]; then
    echo "❌ Function directory not found: $FUNCTION_DIR"
    return 1
  fi
  
  cd "$FUNCTION_DIR"
  
  # Install dependencies
  echo "  ├─ Installing dependencies..."
  npm install --production --silent
  
  # Create zip file
  echo "  ├─ Creating deployment package..."
  zip -qr "../${FUNCTION_NAME}.zip" . -x "*.git*" "*.DS_Store"
  
  echo "  └─ ✅ Built: ../$(basename "${FUNCTION_NAME}.zip")"
}

# Build all functions
build_function "questions"
build_function "auth"
build_function "user-profile"
build_function "user-progress"

echo ""
echo "✅ All Lambda functions built successfully!"
echo ""
echo "Deployment packages created:"
ls -lh "$FUNCTIONS_DIR"/*.zip 2>/dev/null || echo "No zip files found"
echo ""
