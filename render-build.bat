@echo off
REM Render Build Script for InkWell Monorepo (Windows Version)
echo 🚀 Starting InkWell build process...

REM Install root dependencies
echo 📦 Installing root dependencies...
call npm install

REM Install and build frontend
echo 🎨 Installing and building frontend...
cd frontend
call npm install
call npm run build
cd ..

REM Copy frontend build to backend
echo 📁 Copying frontend build to backend...
xcopy /E /I frontend\build backend\build

REM Install backend dependencies
echo ⚙️ Installing backend dependencies...
cd backend
call npm install
cd ..

echo ✅ Build completed successfully!
pause 