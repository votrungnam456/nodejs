# Node.js Authentication System

This project implements a complete authentication system with JWT tokens and cookies.

## Features

- **Login System**: Users can log in with username/password
- **JWT Token Authentication**: Secure token-based authentication
- **HTTP-Only Cookies**: Tokens stored in secure HTTP-only cookies
- **Protected Routes**: API endpoints protected with authentication middleware
- **User Session Management**: Automatic user data loading on homepage
- **Logout Functionality**: Secure logout with cookie clearing

## API Endpoints

### Authentication

- `POST /api/user/login` - Login with username/password
- `POST /api/user/logout` - Logout and clear cookies
- `GET /api/user/me` - Get current user data (protected)

### Protected Routes

- `GET /api/user` - Get all external users (protected)
- `GET /api/user/:id` - Get user by ID (protected)

## Pages

- `/` - Login page
- `/homepage` - Protected homepage with user info
- `/signup` - User registration page

## How it Works

1. **Login Flow**:

   - User submits login form
   - Server validates credentials
   - JWT token generated and set as HTTP-only cookie
   - User redirected to homepage

2. **Authentication Check**:

   - Homepage checks for valid token in cookies
   - If valid, loads user data and displays welcome message
   - If invalid, redirects to login page

3. **Protected Routes**:

   - All protected API routes use `authMiddleware`
   - Middleware verifies JWT token from cookies
   - If valid, adds user data to request object
   - If invalid, returns 401 error

4. **Logout**:
   - Clears the auth token cookie
   - Redirects to login page

## Environment Variables

Create a `.env` file with:

```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

## Demo Credentials

- Username: `admin`
- Password: `password123`

## Security Features

- HTTP-only cookies prevent XSS attacks
- JWT tokens with expiration (1 hour)
- Secure cookie settings for production
- Password hashing with bcrypt
- Protected API routes with middleware

## Running the Application

1. Install dependencies: `npm install`
2. Set up environment variables
3. Start the server: `npm start`
4. Visit `http://localhost:3000`
