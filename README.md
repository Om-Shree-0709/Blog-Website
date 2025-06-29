# InkWell - Modern Blogging Platform

A modern, production-ready blogging platform built with the MERN stack (MongoDB, Express.js, React, Node.js). InkWell provides a beautiful, responsive interface for writers to share their stories and readers to discover amazing content.

## ✨ Features

### For Writers

- **Rich Text Editor**: Create beautiful posts with React Quill editor
- **Draft System**: Save and edit drafts before publishing
- **Image Upload**: Support for featured images and inline images
- **Categories & Tags**: Organize content with categories and tags
- **SEO Optimization**: Built-in SEO fields for better search visibility
- **Analytics Dashboard**: Track views, likes, and engagement

### For Readers

- **Beautiful UI**: Modern, responsive design with dark mode support
- **Search & Filter**: Advanced search with category and tag filtering
- **Bookmarks**: Save favorite posts for later reading
- **Comments**: Engage with authors and other readers
- **User Profiles**: Discover more content from favorite authors

### Technical Features

- **Authentication**: JWT-based authentication with role-based access
- **Real-time Updates**: Live comment updates and notifications
- **Performance**: Optimized with compression and caching
- **Security**: Helmet.js, rate limiting, and input validation
- **Mobile Responsive**: Works perfectly on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd inkwell-blog-website
   ```

2. **Install dependencies**

   ```bash
   npm run install-all
   ```

3. **Environment Setup**

   ```bash
   cd backend
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🏗️ Project Structure

```
inkwell-blog-website/
├── backend/                 # Express.js API server
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── app.js             # Express app configuration
│   └── server.js          # Server entry point
├── frontend/               # React.js client
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── App.js         # Main app component
│   └── public/            # Static assets
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/inkwell-blog

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload (Optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🚀 Production Deployment

### Option 1: Heroku Deployment

1. **Create Heroku App**

   ```bash
   heroku create your-inkwell-app
   ```

2. **Set Environment Variables**

   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your-mongodb-atlas-uri
   heroku config:set JWT_SECRET=your-production-jwt-secret
   heroku config:set CORS_ORIGIN=https://your-app.herokuapp.com
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 2: Vercel + Railway

1. **Deploy Backend to Railway**

   - Connect your GitHub repository to Railway
   - Set environment variables
   - Deploy the backend

2. **Deploy Frontend to Vercel**

   ```bash
   cd frontend
   vercel --prod
   ```

3. **Update Frontend API URL**
   - Update the proxy in `frontend/package.json`
   - Or use environment variables for API URL

### Option 3: DigitalOcean App Platform

1. **Connect Repository**

   - Connect your GitHub repository
   - Select the main branch

2. **Configure Build Settings**

   - Build Command: `npm run heroku-postbuild`
   - Run Command: `npm start`
   - Output Directory: `backend`

3. **Set Environment Variables**
   - Add all required environment variables

### Option 4: AWS EC2

1. **Launch EC2 Instance**

   ```bash
   # Connect to your EC2 instance
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Install Dependencies**

   ```bash
   sudo apt update
   sudo apt install nodejs npm nginx
   ```

3. **Deploy Application**

   ```bash
   git clone <your-repo>
   cd inkwell-blog-website
   npm run install-all
   npm run build
   ```

4. **Configure PM2**

   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name "inkwell-backend"
   pm2 startup
   pm2 save
   ```

5. **Configure Nginx**

   ```bash
   sudo nano /etc/nginx/sites-available/inkwell
   ```

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/inkwell /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt.js for password security
- **Input Validation**: Express-validator for data validation
- **Rate Limiting**: Prevent abuse with express-rate-limit
- **Helmet.js**: Security headers and protection
- **CORS**: Configured for production domains
- **SQL Injection Protection**: MongoDB with proper queries

## 📊 Performance Optimization

- **Compression**: gzip compression for faster loading
- **Image Optimization**: Responsive images and lazy loading
- **Code Splitting**: React lazy loading for better performance
- **Caching**: Browser caching and API response caching
- **CDN Ready**: Static assets optimized for CDN delivery

## 🧪 Testing

```bash
# Run frontend tests
cd frontend
npm test

# Run backend tests (when implemented)
cd backend
npm test
```

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/change-password` - Change password

### Posts Endpoints

- `GET /api/posts` - Get all published posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:slug` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Search Endpoints

- `GET /api/search/posts` - Search posts
- `GET /api/search/users` - Search users
- `GET /api/search/tags` - Get popular tags
- `GET /api/search/categories` - Get category stats

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/inkwell-blog-website/issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Frontend framework
- [Express.js](https://expressjs.com/) - Backend framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [React Quill](https://quilljs.com/) - Rich text editor
- [Lucide React](https://lucide.dev/) - Icons

---

**InkWell** - Where stories come to life ✨
