# 🖋️ InkWell Blog Platform

[![React](https://img.shields.io/badge/React-18.0.0-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0.0-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18.0-black.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0.0-green.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, full-stack blog platform built with React, Express.js, and MongoDB. InkWell provides a complete blogging solution with user authentication, rich text editing, comment system, and responsive design.

## ✨ Features

- 🔐 **User Authentication** - Secure JWT-based authentication system
- 📝 **Rich Text Editor** - Create beautiful blog posts with React Quill
- 💬 **Comment System** - Interactive commenting with real-time updates
- 🔍 **Search Functionality** - Advanced search across posts and content
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS
- 🎨 **Modern UI/UX** - Clean, intuitive interface with dark/light themes
- 🔒 **Security First** - Comprehensive security measures and best practices
- ⚡ **Performance Optimized** - Fast loading times and efficient data handling
- 👥 **User Profiles** - Personalized user dashboards and profiles
- 📊 **Admin Dashboard** - Content management and user administration

## 🏗️ Architecture

InkWell follows a modern monorepo architecture with clear separation of concerns:

```
Blog Website/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── backend/                 # Express.js backend API
│   ├── controllers/        # Route controllers
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── utils/             # Backend utilities
└── package.json           # Root monorepo configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB database
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/inkwell-blog.git
   cd inkwell-blog
   ```

2. **Install dependencies**

   ```bash
   npm run install:all
   ```

3. **Environment Setup**

   Create `.env` files in both frontend and backend directories:

   **Backend (.env)**

   ```env
   NODE_ENV=development
   PORT=7777
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   COOKIE_EXPIRE=7
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

   **Frontend (.env)**

   ```env
   REACT_APP_API_URL=http://localhost:7777/api
   ```

4. **Start development servers**

   ```bash
   # Start both frontend and backend concurrently
   npm run dev

   # Or start them separately
   npm run dev:backend   # Backend on http://localhost:7777
   npm run dev:frontend  # Frontend on http://localhost:3000
   ```

## 🌐 Deployment

### Render Deployment

1. **Connect Repository**

   - Link your GitHub repository to Render
   - Create a new Web Service

2. **Environment Variables**
   Set the following environment variables in Render dashboard:

   ```env
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_production_mongodb_uri
   JWT_SECRET=your_production_jwt_secret
   JWT_EXPIRE=7d
   COOKIE_EXPIRE=7
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   REACT_APP_API_URL=your_render_backend_url
   GENERATE_SOURCEMAP=false
   ```

3. **Build Configuration**
   - **Build Command:** `chmod +x render-build.sh && ./render-build.sh`
   - **Start Command:** `cd backend && npm start`
   - **Root Directory:** Leave empty

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern React with hooks and functional components
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Hook Form** - Form handling and validation
- **React Quill** - Rich text editor
- **React Context** - State management

### Backend

- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **bcrypt** - Password hashing
- **Multer** - File upload handling
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Posts

- `GET /api/posts` - Get all posts (with pagination)
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Comments

- `GET /api/posts/:id/comments` - Get post comments
- `POST /api/comments` - Add comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Users

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (admin only)

### Search

- `GET /api/search` - Search posts and users
- `GET /api/health` - Health check endpoint

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for password security
- **CORS Protection** - Cross-origin request handling
- **Rate Limiting** - API request throttling
- **XSS Protection** - Cross-site scripting prevention
- **MongoDB Injection Protection** - Query sanitization
- **Helmet Security Headers** - Additional security headers
- **Input Validation** - Comprehensive input sanitization

## 📱 Screenshots

_[Add screenshots of your application here]_

## 🧪 Testing

```bash
# Run frontend tests
cd frontend && npm test

# Run backend tests
cd backend && npm test
```

## 📦 Available Scripts

### Root Level

```bash
npm run install:all    # Install all dependencies
npm run build         # Build both frontend and backend
npm run dev           # Start both development servers
npm start            # Start production server
```

### Frontend

```bash
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run eject        # Eject from Create React App
```

### Backend

```bash
npm start            # Start production server
npm run dev          # Start development server with nodemon
npm test             # Run tests
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 🐛 Troubleshooting

### Common Issues

**Build fails on Render**

- Verify all environment variables are set correctly
- Check MongoDB connection string format
- Ensure Node.js version compatibility

**Frontend can't connect to backend**

- Verify CORS configuration
- Check API URL in environment variables
- Ensure backend server is running

**Static files not serving**

- Confirm frontend build exists in `frontend/build/`
- Check static file path in `backend/app.js`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)
- Portfolio: [Your Portfolio](https://yourportfolio.com)

## 🙏 Acknowledgments

- React team for the amazing framework
- Express.js community for the robust backend framework
- Tailwind CSS for the utility-first styling approach
- MongoDB for the flexible database solution

---

⭐ **Star this repository if you found it helpful!**

**Note:** This is a monorepo setup where the backend serves the frontend build files in production. The frontend build is placed inside the backend folder during deployment for optimal performance.
