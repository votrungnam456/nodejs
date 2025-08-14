const express = require("express");
const router = express.Router();
const Product = require("../../model/product.js");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream");
const StreamArray = require("stream-json/streamers/StreamArray");
const PQueue = require("p-queue").default;

// Add timeout middleware for this route
const timeout = (ms) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      res.status(408).json({
        success: false,
        message: "Request timeout - operation took too long",
      });
    }, ms);

    res.on("finish", () => {
      clearTimeout(timer);
    });

    next();
  };
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only JSON files
    if (
      file.mimetype === "application/json" ||
      file.originalname.endsWith(".json")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only JSON files are allowed!"), false);
    }
  },
});

// Get all products with filtering and pagination
router.get("/products", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = { isAvailable: true };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get products with pagination
    const products = await Product.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});

// Get single product by ID
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
});

// Create new product
router.post(
  "/products",
  timeout(600000),
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }
    const batchSize = 3; // test với batch nhỏ
    let batch = [];
    let successCount = 0;
    let failedCount = 0;
    let streamEnded = false;

    const queue = new PQueue({ concurrency: 1 }); // chỉ xử lý 1 batch cùng lúc

    const processBatch = async (batchData) => {
      console.log("xu ly batch");
      if (batchData.length === 0) return;
      try {
        await Product.insertMany(batchData, { ordered: false });
        successCount += batchData.length;
      } catch (err) {
        console.error("Batch insert error:", err.message);
        failedCount += batchData.length;
      }
    };

    const jsonStream = StreamArray.withParser();
    const fileStream = fs.createReadStream(req.file.path);

    pipeline(fileStream, jsonStream, (err) => {
      if (err) {
        console.error("❌ Pipeline failed:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to process file" });
      }
    });

    jsonStream.on("data", ({ value }) => {
      if (!value._source) {
        failedCount++;
        return;
      }

      batch.push(value._source);

      if (batch.length >= batchSize) {
        const batchToInsert = batch;
        batch = [];
        queue.add(() => processBatch(batchToInsert));
      }
    });

    jsonStream.on("end", () => {
      // xử lý batch cuối
      if (batch.length > 0) {
        const lastBatch = batch;
        batch = [];
        queue.add(() => processBatch(lastBatch));
      }
      streamEnded = true;
    });

    // Khi queue trống và stream đã hết → trả response
    const checkFinish = setInterval(() => {
      if (streamEnded && queue.size === 0 && queue.pending === 0) {
        clearInterval(checkFinish);
        fs.unlinkSync(req.file.path);
        console.log(
          `✅ Import completed: ${successCount} success, ${failedCount} failed`
        );
        res.json({
          success: true,
          message: "Import completed",
          data: { successCount, failedCount },
        });
      }
    }, 200);
  }
);

// Update product
router.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(400).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
});

// Delete product
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
});

// Get product categories
router.get("/products/categories", async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
});

module.exports = router;
