const express = require("express");
const router = express.Router();
const Category = require("../../model/category.js");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream");
const StreamArray = require("stream-json/streamers/StreamArray");
const PQueue = require("p-queue").default;

// Add timeout middleware for this route
const timeout = (ms) => (req, res, next) => {
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"), // Make sure this directory exists
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage: storage,
  // Accept only JSON files
  fileFilter: (req, file, cb) => {
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

// Get all categories with filtering and pagination
router.get("/categories", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      isActive,
      sortBy = "sortOrder",
      sortOrder = "asc",
    } = req.query;

    // Build filter object
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get categories with pagination
    const categories = await Category.find(filter)
      .populate("parent", "name slug")
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const total = await Category.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: categories,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCategories: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
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

// Get single category by ID
router.get("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "parent",
      "name slug"
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
});

// Get category by slug
router.get("/categories/slug/:slug", async (req, res) => {
  try {
    const category = await Category.findBySlug(req.params.slug).populate(
      "parent",
      "name slug"
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category by slug:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
});

// Create new category
router.post("/categories", async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(400).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
});

// Import categories from JSON file
router.post("/categories/import", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  console.log("Category import file:", req.file);
  const batchSize = 50;
  let batch = [];
  let successCount = 0;
  let failedCount = 0;
  let streamEnded = false;
  let totalProcessed = 0;
  const startTime = Date.now();

  // Declare intervals early to avoid reference errors
  let progressInterval;
  let checkFinish;

  const queue = new PQueue({
    concurrency: 3,
    timeout: 30000,
    retry: 2,
  });

  const processBatch = async (batchData) => {
    if (batchData.length === 0) return;
    try {
      console.log(`Processing category batch with ${batchData.length} records`);

      // Process each category in the batch
      for (const categoryData of batchData) {
        try {
          // Check if category already exists by slug
          const existingCategory = await Category.findOne({
            slug: categoryData.slug,
          });

          if (existingCategory) {
            // Update existing category
            await Category.findByIdAndUpdate(existingCategory._id, {
              name: categoryData.name,
              slug: categoryData.slug,
              originalId: categoryData._id || existingCategory.originalId,
              updatedAt: Date.now(),
            });
            console.log(`Updated existing category: ${categoryData.name}`);
          } else {
            // Create new category
            const newCategory = new Category({
              name: categoryData.name,
              slug: categoryData.slug,
              originalId: categoryData._id || "",
              isActive: true,
            });
            await newCategory.save();
            console.log(`Created new category: ${categoryData.name}`);
          }
          successCount++;
        } catch (err) {
          console.error(
            `Error processing category ${categoryData.name}:`,
            err.message
          );
          failedCount++;
        }
      }

      console.log(
        `✅ Category batch processed successfully: ${batchData.length} records`
      );
    } catch (err) {
      console.error("❌ Category batch insert error:", err.message);
      failedCount += batchData.length;
    }
  };

  // Function to send final response
  const sendFinalResponse = () => {
    console.log("Category import completed, sending response...");

    // Clear all intervals
    if (progressInterval) clearInterval(progressInterval);
    if (checkFinish) clearInterval(checkFinish);

    // Clean up file
    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.error("Error deleting file:", err.message);
    }

    const totalTime = Date.now() - startTime;
    console.log(
      `✅ Category import completed in ${totalTime}ms: ${successCount} success, ${failedCount} failed`
    );

    res.json({
      success: true,
      message: "Category import completed",
      data: {
        successCount,
        failedCount,
        totalTime: `${totalTime}ms`,
        averageTimePerRecord: totalTime / (successCount + failedCount),
      },
    });
  };

  const jsonStream = StreamArray.withParser();
  const fileStream = fs.createReadStream(req.file.path);

  // Handle pipeline errors
  pipeline(fileStream, jsonStream, (err) => {
    if (err) {
      console.error("❌ Pipeline failed:", err);
      if (progressInterval) clearInterval(progressInterval);
      if (checkFinish) clearInterval(checkFinish);
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error("Error deleting file:", unlinkErr.message);
      }
      return res.status(500).json({
        success: false,
        message: "Failed to process file",
        error: err.message,
      });
    }
  });

  jsonStream.on("data", ({ value }) => {
    // Skip the first element if it's metadata (count, date)
    if (value.count !== undefined || value.date !== undefined) {
      return;
    }

    if (!value._source) {
      failedCount++;
      totalProcessed++;
      return;
    }

    batch.push(value._source);

    if (batch.length >= batchSize) {
      const batchToInsert = [...batch];
      batch = [];
      queue.add(() => processBatch(batchToInsert));
    }
  });

  jsonStream.on("end", () => {
    console.log(
      "📁 Category file reading completed, processing remaining batches..."
    );
    if (batch.length > 0) {
      const lastBatch = [...batch];
      batch = [];
      queue.add(() => processBatch(lastBatch));
    }
    streamEnded = true;
  });

  // Monitoring progress
  progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    console.log(
      `📊 Category Progress: ${successCount + failedCount} processed, ${
        queue.pending
      } pending, ${elapsed}ms elapsed`
    );
  }, 5000);

  // Check when queue is empty and stream has ended
  checkFinish = setInterval(() => {
    console.log(
      "check finish - streamEnded:",
      streamEnded,
      "queue.pending:",
      queue.pending,
      "queue.size:",
      queue.size
    );

    if (streamEnded && queue.pending === 0 && queue.size === 0) {
      sendFinalResponse();
    }
  }, 1000); // Check every second instead of 500ms

  // Add timeout protection
  const timeoutId = setTimeout(() => {
    console.log("Import timeout reached, forcing completion...");
    if (progressInterval) clearInterval(progressInterval);
    if (checkFinish) clearInterval(checkFinish);
    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.error("Error deleting file:", err.message);
    }

    res.status(408).json({
      success: false,
      message: "Import timeout - operation took too long",
      data: {
        successCount,
        failedCount,
        totalTime: `${Date.now() - startTime}ms`,
      },
    });
  }, 600000); // 10 minutes timeout

  // Clear timeout when response is sent
  res.on("finish", () => {
    clearTimeout(timeoutId);
  });
});

// Update category
router.put("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(400).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
});

// Delete category
router.delete("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
});

// Get all active categories (for dropdowns, etc.)
router.get("/categories/active", async (req, res) => {
  try {
    const categories = await Category.getActiveCategories();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching active categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active categories",
      error: error.message,
    });
  }
});

module.exports = router;
