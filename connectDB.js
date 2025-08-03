const { MongoClient } = require("mongodb");

const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

// Database Name
const dbName = "nodejs";

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    // const collection = db.collection("documents");
    return db;
  } catch (err) {
    console.error("Failed to connect to the database", err);
    throw err; // Ném lại lỗi để có thể xử lý ở nơi gọi hàm này
  }
}

// Xuất hàm này theo kiểu CommonJS
module.exports = { connectDB };
