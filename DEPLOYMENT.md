# 🚀 Render Deployment Guide for InkWell

This guide will help you deploy your InkWell blog website as a monorepo on Render.

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **MongoDB Database**: Set up a MongoDB database (Atlas recommended)

## 🔧 Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your repository has the following structure:

```
inkwell-monorepo/
├── frontend/
├── backend/
├── package.json
├── render-build.sh
└── README.md
```

### 2. Create a New Web Service on Render

1. Go to your Render dashboard
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**

- **Name**: `inkwell-backend` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (root of monorepo)

**Build & Deploy Settings:**

- **Build Command**: `chmod +x render-build.sh && ./render-build.sh`
- **Start Command**: `cd backend && npm start`

### 3. Set Environment Variables

In your Render service dashboard, go to "Environment" tab and add:

**Required Variables:**

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://omkumaramritsar:VjvBzPmlKozU1I9s@cluster1.bzwcsmp.mongodb.net/inkwell
JWT_SECRET=abcd@1234
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
CLOUDINARY_API_KEY=831414735727613
CLOUDINARY_API_SECRET=NZBJmK1yAP6SDXtEd2ZBpz9nbEA
```

**Frontend Variables:**

```
REACT_APP_API_URL=https://inkwell-backend-y8gj.onrender.com/api
GENERATE_SOURCEMAP=false
```

### 4. Deploy

1. Click "Create Web Service"
2. Render will automatically start the build process
3. Monitor the build logs for any errors
4. Once deployed, you'll get a URL like: `https://inkwell-backend-y8gj.onrender.com`

### 5. Update Frontend Environment

After deployment, update your frontend environment:

1. Go to your Render service dashboard
2. Add this environment variable:

```
REACT_APP_API_URL=https://your-service-name.onrender.com/api
```

3. Redeploy the service to apply the changes

## 🔍 Build Process Explanation

The `render-build.sh` script performs these steps:

1. **Install Root Dependencies**: Installs any root-level packages
2. **Build Frontend**:
   - Installs frontend dependencies
   - Runs `npm run build` to create production build
   - Build files are created in `frontend/build/`
3. **Install Backend Dependencies**: Installs backend packages
4. **Backend Serves Frontend**: The backend is configured to serve static files from `frontend/build/`

## 🌐 How It Works

### Development Mode

- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:7777`
- Frontend makes API calls to backend

### Production Mode

- Only backend runs on Render
- Frontend build files are served by the backend
- All requests go through the same domain
- API calls are made to `/api/*` endpoints

## 🐛 Troubleshooting

### Build Fails

**Common Issues:**

1. **Node Version**: Ensure you're using Node.js 16+ in `package.json`
2. **Missing Dependencies**: Check if all dependencies are in `package.json`
3. **Build Script**: Verify `render-build.sh` has execute permissions

**Debug Steps:**

1. Check build logs in Render dashboard
2. Test build locally: `chmod +x render-build.sh && ./render-build.sh`
3. Verify all environment variables are set

### Frontend Not Loading

**Check:**

1. Frontend build exists: `frontend/build/index.html`
2. Backend serves static files correctly
3. No JavaScript errors in browser console

### API Calls Failing

**Check:**

1. CORS configuration in `backend/app.js`
2. API URL in frontend environment variables
3. Backend routes are working: `/api/health`

### Database Connection Issues

**Check:**

1. MongoDB URI is correct
2. Network access is allowed
3. Database credentials are valid

## 🔄 Updating Your Application

1. **Push Changes**: Commit and push to your GitHub repository
2. **Auto-Deploy**: Render will automatically detect changes and redeploy
3. **Manual Deploy**: Or trigger manual deployment from Render dashboard

## 📊 Monitoring

- **Logs**: View real-time logs in Render dashboard
- **Health Check**: Visit `/api/health` endpoint
- **Performance**: Monitor response times and errors

## 🔒 Security Considerations

1. **Environment Variables**: Never commit sensitive data
2. **CORS**: Configure allowed origins properly
3. **Rate Limiting**: Already implemented in backend
4. **HTTPS**: Render provides SSL certificates automatically

## 💰 Cost Optimization

- **Free Tier**: Render offers free tier for development
- **Auto-Sleep**: Free services sleep after 15 minutes of inactivity
- **Scaling**: Upgrade to paid plan for always-on service

## 🆘 Support

If you encounter issues:

1. Check Render documentation: [docs.render.com](https://docs.render.com)
2. Review build logs for specific error messages
3. Test locally to isolate issues
4. Contact Render support if needed

---

**Note**: This deployment setup creates a single service that serves both your API and frontend, making it cost-effective and easier to manage.
