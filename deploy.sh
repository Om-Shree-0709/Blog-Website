#!/bin/bash

# 🚀 Blog Website Deployment Script
# This script helps prepare your application for deployment

echo "🚀 Starting deployment preparation..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Found project root"

# Step 1: Check if all files are committed
echo "📝 Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "Please commit your changes before deploying:"
    echo "  git add ."
    echo "  git commit -m 'Prepare for deployment'"
    echo "  git push origin main"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ All changes are committed"
fi

# Step 2: Test backend build
echo "🔧 Testing backend build..."
cd backend
if npm install; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Backend dependency installation failed"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: No .env file found in backend directory"
    echo "Please create backend/.env with your production environment variables"
    echo "See DEPLOYMENT_GUIDE.md for details"
else
    echo "✅ Backend .env file found"
fi

cd ..

# Step 3: Test frontend build
echo "🔧 Testing frontend build..."
cd frontend
if npm install; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Frontend dependency installation failed"
    exit 1
fi

if npm run build; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

# Step 4: Check for sensitive files
echo "🔒 Checking for sensitive files..."
if git ls-files | grep -E "\.(env|key|pem|p12|pfx)$"; then
    echo "⚠️  Warning: Found potentially sensitive files in git"
    echo "Please ensure these files are in .gitignore"
else
    echo "✅ No sensitive files found in git"
fi

# Step 5: Display next steps
echo ""
echo "🎉 Deployment preparation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your database (MongoDB Atlas recommended)"
echo "2. Configure Cloudinary for image uploads (optional)"
echo "3. Choose your deployment platform:"
echo "   - Render (recommended for beginners)"
echo "   - Vercel + Railway"
echo "   - DigitalOcean App Platform"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
echo "🔗 Quick links:"
echo "- MongoDB Atlas: https://www.mongodb.com/atlas"
echo "- Cloudinary: https://cloudinary.com/"
echo "- Render: https://render.com"
echo "- Vercel: https://vercel.com"
echo "- Railway: https://railway.app"
echo ""
echo "Good luck with your deployment! 🚀" 