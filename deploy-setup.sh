#!/bin/bash

# 1time.ai Deployment Setup Script
# This script helps prepare your app for deployment

echo "🚀 Setting up 1time.ai for deployment..."

# Create production build script
echo "📦 Creating production build..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Please check the error messages above."
    exit 1
fi

# Create necessary directories
mkdir -p dist/public

# Copy static files to dist/public if they don't exist
if [ ! -d "dist/public" ]; then
    echo "📁 Creating dist/public directory..."
    mkdir -p dist/public
fi

echo "✅ Deployment setup complete!"
echo ""
echo "Next steps:"
echo "1. Choose a hosting platform (Vercel, Railway, Render, etc.)"
echo "2. Set up your database (Neon, Supabase, or PlanetScale)"
echo "3. Configure environment variables"
echo "4. Deploy using the configuration files provided"
echo ""
echo "See DEPLOYMENT.md for detailed instructions."