#!/bin/bash

# Render Build Script for InkWell Monorepo
echo "🚀 Starting InkWell build process..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install and build frontend
echo "🎨 Installing and building frontend..."
cd frontend
npm install
npm run build
cd ..

# Copy frontend build to backend
echo "📁 Copying frontend build to backend..."
cp -r frontend/build backend/

# Install backend dependencies
echo "⚙️ Installing backend dependencies..."
cd backend
npm install
cd ..

echo "✅ Build completed successfully!" 