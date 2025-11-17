# Node.js Learning Project

## Cấu trúc dự án

```
nodejs/
├── config/                 # Cấu hình ứng dụng
│   └── database.js        # Kết nối MongoDB
├── constants/             # Các hằng số
│   ├── api.js            # Định nghĩa API endpoints
│   ├── http.js           # HTTP status codes
│   └── messages.js       # Thông báo hệ thống
├── controllers/           # Business logic handlers
│   └── importHandlers/   # Handlers cho import dữ liệu
│       └── productHandler.js
├── cron/                 # Scheduled tasks
│   └── importCron.js     # Cron job xử lý import
├── middleware/           # Express middleware
│   ├── auth.js          # Xác thực JWT cho API
│   ├── pageAuth.js      # Xác thực cho trang web
│   └── redirectIfLoggedIn.js
├── models/              # Mongoose models
│   ├── category.js
│   ├── importHistory.js
│   ├── note.js
│   ├── product.js
│   └── user.js
├── public/              # Static files
│   ├── assets/
│   │   ├── css/        # Stylesheets
│   │   ├── js/         # Client-side JavaScript
│   │   └── images/     # Images
│   └── json/           # Sample JSON files
├── routes/              # Route definitions
│   ├── api/            # API routes
│   │   ├── auth.js
│   │   ├── category.js
│   │   ├── importHistory.js
│   │   ├── product.js
│   │   └── user.js
│   └── views.js        # View routes
├── src/                # Server-side views
│   └── views/          # EJS templates
├── uploads/            # Uploaded files directory
├── utils/              # Utility functions
│   ├── jsonImport.js   # JSON import utility
│   └── upload.js       # File upload configuration
└── server.js           # Entry point

```

## Cài đặt

```bash
npm install
```

## Chạy ứng dụng

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Môi trường

Tạo file `.env` với các biến sau:

```
PORT=3000
HOST_NAME=localhost
MONGODB_URL=mongodb://localhost:27017/
MONGODB_DB_NAME=nodejs
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## Tính năng

- Authentication & Authorization (JWT)
- Product & Category Management
- JSON Import với batch processing
- Cron job tự động xử lý import
- File upload handling
