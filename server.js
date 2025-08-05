const express = require("express");
const connectDB = require("./connectDB.js");
const app = express();
const port = process.env.PORT || 3000;
const hostname = process.env.HOST_NAME || "localhost";
const path = require("path");

// Import route files
const viewRoutes = require("./routes/views");
const apiRoutes = require("./routes/api");

require("dotenv").config();

app.set("views", "./src/views/");
app.set("view engine", "ejs");

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use("/api", apiRoutes);
app.use("/", viewRoutes);

app.listen(port, hostname, () => {
  console.log(`Example app listening on port ${port}`);
});
