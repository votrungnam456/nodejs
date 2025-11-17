// Database configuration
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.MONGODB_URL || "mongodb://localhost:27017/";
const dbName = process.env.MONGODB_DB_NAME || "nodejs";

export const connectDB = async () => {
  try {
    await mongoose.connect(url + dbName, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB with Mongoose");
  } catch (err) {
    console.error("❌ Mongoose connection error:", err);
    throw err;
  }
};
