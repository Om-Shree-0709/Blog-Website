# InkWell Blog Website - Full Stack Monorepo

A modern blog website built with React frontend and Express.js backend, deployed as a monorepo on Render.

## 🏗️ Project Structure

```
inkwell-monorepo/
├── frontend/          # React frontend application
├── backend/           # Express.js backend API
├── package.json       # Root monorepo configuration
├── render-build.sh    # Render deployment script
└── README.md         # This file
```

## 🚀 Quick Start

### Local Development

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd inkwell-monorepo
   ```

2. **Install all dependencies**

   ```bash
   npm run install:all
   ```

3. **Start development servers**

   ```bash
   # Start both frontend and backend
   npm run dev

   # Or start them separately
   npm run dev:backend  # Backend on port 7777
   npm run dev:frontend # Frontend on port 3000
   ```

### Production Build

```bash
npm run build
```

## 🌐 Deployment on Render

### Prerequisites

1. Create a Render account
2. Connect your GitHub repository
3. Set up environment variables in Render dashboard

### Environment Variables

Set these in your Render service environment:

**Backend Variables:**

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

### Render Configuration

1. **Service Type:** Web Service
2. **Build Command:** `chmod +x render-build.sh && ./render-build.sh`
3. **Start Command:** `cd backend && npm start`
4. **Root Directory:** Leave empty (root of monorepo)

### Build Process

The build script (`render-build.sh`) will:

1. Install root dependencies
2. Build the frontend React app
3. Install backend dependencies
4. The backend will serve the frontend build files

## 📁 File Structure Details

### Frontend (`/frontend`)

- React 18 with modern hooks
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- React Hook Form for forms
- React Quill for rich text editing

### Backend (`/backend`)

- Express.js server
- MongoDB with Mongoose
- JWT authentication
- File upload with Multer
- Security middleware (Helmet, CORS, etc.)
- Rate limiting
- API routes for posts, users, comments, etc.

## 🔧 Available Scripts

### Root Level

- `npm run install:all` - Install dependencies for all packages
- `npm run build` - Build both frontend and backend
- `npm run dev` - Start both development servers
- `npm start` - Start production server

### Frontend

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Backend

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 🌍 API Endpoints

The backend provides the following API endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/comments` - Add comment
- `GET /api/search` - Search posts
- `GET /api/health` - Health check

## 🔒 Security Features

- JWT authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- XSS protection
- MongoDB injection protection
- Helmet security headers

## 📝 Environment Configuration

### Development

Frontend will use `http://localhost:7777/api` for API calls.

### Production

Frontend will use the Render backend URL for API calls.

## 🐛 Troubleshooting

### Common Issues

1. **Build fails on Render**

   - Check if all environment variables are set
   - Ensure MongoDB connection string is correct
   - Verify Node.js version compatibility

2. **Frontend can't connect to backend**

   - Check CORS configuration
   - Verify API URL in environment variables
   - Ensure backend is running

3. **Static files not serving**
   - Check if frontend build exists in `frontend/build/`
   - Verify the path in `backend/app.js`

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note:** This is a monorepo setup where the backend serves the frontend build files in production. The frontend build will be placed inside the backend folder during deployment.
