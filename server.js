const express = require("express");
const connectDB = require("./connectDB.js");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 3000;
const hostname = process.env.HOST_NAME || "localhost";
const path = require("path");

// Import route files
const viewRoutes = require("./routes/views");
const apiUserRoutes = require("./routes/api/user.js");
const apiProductRoutes = require("./routes/api/product.js");
const apiCategoryRoutes = require("./routes/api/category.js");

require("dotenv").config();

app.set("views", "./src/views/");
app.set("view engine", "ejs");

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Increase timeout for long-running operations
app.use((req, res, next) => {
  res.setTimeout(600000); // 10 minutes for import operations
  next();
});

// Add memory management middleware
app.use((req, res, next) => {
  // Force garbage collection if memory usage is high
  if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) {
    // 500MB
    if (global.gc) {
      global.gc();
    }
  }
  next();
});

app.use(express.static(path.join(__dirname, "public")));

// Database connection
connectDB
  .connectDB()
  .then(async (db) => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.error("Failed to connect to database", err);
  });

// Use route files
app.use("/api", apiUserRoutes);
app.use("/api", apiProductRoutes);
app.use("/api", apiCategoryRoutes);
app.use("/", viewRoutes);

app.listen(port, hostname, () => {
  console.log(`Example app listening on port ${port}`);
});
