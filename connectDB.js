// db.js
const mongoose = require("mongoose");

const url = "mongodb://localhost:27017/";

const dbName = "nodejs";
async function connectDB() {
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
}

module.exports = { connectDB };
