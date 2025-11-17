import express from "express";
import { connectDB } from "@/config/database.js";
import cookieParser from "cookie-parser";
const app = express();
const port = process.env.PORT || 3000;
const hostname = process.env.HOST_NAME || "localhost";
import path from "path";
import { fileURLToPath } from "url";
import { API } from "@/constants/api.js";

// Import route files
import viewRoutes from "@/routes/views.js";
import apiUserRoutes from "@/routes/api/user.js";
import apiProductRoutes from "@/routes/api/product.js";
import apiCategoryRoutes from "@/routes/api/category.js";
import apiAuthRoutes from "@/routes/api/auth.js";
import apiImportHistoryRoutes from "@/routes/api/importHistory.js";

import "@/cron/importCron.js";

import dotenv from "dotenv";
dotenv.config();

app.set("views", "./src/views/");
app.set("view engine", "ejs");

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Increase timeout for long-running operations
app.use((req, res, next) => {
  res.setTimeout(600000);
  next();
});

// Add memory management middleware
app.use((req, res, next) => {
  if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) {
    if (global.gc) {
      global.gc();
    }
  }
  next();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Serve client API constants from server constants
app.get("/assets/js/api.js", (req, res) => {
  const prefix = "/api";
  const withPrefix = (api) => ({
    AUTH: {
      LOGIN: `${prefix}${api.AUTH.LOGIN}`,
      LOGOUT: `${prefix}${api.AUTH.LOGOUT}`,
      SIGNUP: `${prefix}${api.AUTH.SIGNUP}`,
      FORGOT_PASSWORD: `${prefix}${api.AUTH.FORGOT_PASSWORD}`,
      RESET_PASSWORD: `${prefix}${api.AUTH.RESET_PASSWORD}`,
      CHANGE_PASSWORD: `${prefix}${api.AUTH.CHANGE_PASSWORD}`,
    },
    USER: {
      ME: `${prefix}${api.USER.ME}`,
    },
    PRODUCTS: {
      BASE: `${prefix}${api.PRODUCTS.BASE}`,
      NEW: `${prefix}${api.PRODUCTS.NEW}`,
      CATEGORIES: `${prefix}${api.PRODUCTS.CATEGORIES}`,
    },
    CATEGORIES: {
      BASE: `${prefix}${api.CATEGORIES.BASE}`,
      BY_SLUG_PREFIX: `${prefix}/categories/slug/`,
      ACTIVE: `${prefix}${api.CATEGORIES.ACTIVE}`,
      IMPORT: `${prefix}${api.CATEGORIES.IMPORT}`,
    },
  });
  const clientApi = withPrefix(API);
  const js = `window.API = ${JSON.stringify(clientApi)};`;
  res.type("application/javascript").send(js);
});

// Database connection
connectDB()
  .then(async (db) => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.error("Failed to connect to database", err);
  });

// Use route files
app.use("/api", apiAuthRoutes);
app.use("/api", apiUserRoutes);
app.use("/api", apiProductRoutes);
app.use("/api", apiCategoryRoutes);
app.use("/api", apiImportHistoryRoutes);
app.use("/", viewRoutes);

app.listen(port, hostname, () => {
  console.log(`Example app listening on port ${port}`);
});
