const express = require("express");
const router = express.Router();
const Product = require("../../model/product.js");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

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
    console.log("file", file);
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
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const filePath = req.file.path;
      console.log("File uploaded:", req.file.originalname);
      console.log("File path:", filePath);

      // Add timeout for file reading
      const jsonData = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("File reading timeout"));
        }, 30000); // 30 seconds timeout

        try {
          const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
          clearTimeout(timeout);
          resolve(data);
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      });
      // console.log("JSON data received:", jsonData);
      // console.log("Data type:", typeof jsonData);
      // console.log("Is array:", Array.isArray(jsonData));

      // Ensure jsonData is an array
      const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
      console.log("Data array:", dataArray.length);
      const resultImport = {
        success: 0,
        failed: 0,
        total: dataArray.length,
      };
      const dataImport = [];

      for (const item of dataArray) {
        if (item._source) {
          // try {
          //   // Validate required fields
          //   if (!item._source.title && !item._source.sku) {
          //     console.warn("Skipping item with no title and sku:", item._id);
          //     resultImport.failed++;
          //     continue;
          //   }

          //   // Transform data to match Product schema
          //   const productData = {
          //     title: item._source.title || "Untitled Product",
          //     sku:
          //       item._source.sku ||
          //       `SKU_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          //     ean: item._source.ean || "EAN/UPC code",
          //     active:
          //       item._source.active !== undefined ? item._source.active : true,
          //     is_variant:
          //       item._source.is_variant !== undefined
          //         ? item._source.is_variant
          //         : false,
          //     image: item._source.image || "/assets/images/default-product.png",
          //     url: item._source.url || `/product/${Date.now()}`,
          //     description: item._source.description || "No description available",
          //     description_long: item._source.description_long || "",
          //     stock: item._source.stock || 999,
          //     stockstatus: item._source.stockstatus || 1,
          //     stock_flag: item._source.stock_flag || 1,
          //     categories: {
          //       main: item._source.categories?.main || "Uncategorized",
          //       all: item._source.categories?.all || ["Uncategorized"],
          //     },
          //     media: (item._source.media || []).map((media) => ({
          //       sort: media.sort || 0,
          //       url: media.url || "",
          //       "media-type": media["media-type"] || "image",
          //     })),
          //     product_relations: {
          //       name: item._source.product_relations?.name || "parent",
          //       parent: item._source.product_relations?.parent || null,
          //     },
          //     variants: item._source.variants || [],
          //     string_facet: (item._source.string_facet || []).map((facet) => ({
          //       facet_name: facet.facet_name || "",
          //       facet_value: facet.facet_value || "",
          //     })),
          //     number_facet: (item._source.number_facet || []).map((facet) => ({
          //       facet_name: facet.facet_name || "",
          //       facet_value:
          //         typeof facet.facet_value === "string"
          //           ? parseFloat(facet.facet_value) || 0
          //           : facet.facet_value || 0,
          //     })),
          //   };

          //   dataImport.push(productData);
          //   resultImport.success++;
          // } catch (error) {
          //   console.error("Error processing item:", error);
          //   console.error("Problematic item:", item);
          //   resultImport.failed++;
          // }
          dataImport.push(item._source);
          resultImport.success++;
        } else {
          resultImport.failed++;
        }
      }

      // console.log("Processed items:", dataImport.length);
      // console.log("Success count:", resultImport.success);
      // console.log("Failed count:", resultImport.failed);
      // console.log(dataImport);
      console.log("aaaa");
      const jsonStr = JSON.stringify(dataImport); // Chuyển object/array thành chuỗi JSON
      const bytes = Buffer.byteLength(jsonStr); // Số byte
      const mb = bytes / (1024 * 1024);
      console.log(`File size: ${mb.toFixed(2)} MB`);
      if (dataImport.length > 0) {
        try {
          console.log("import data");

          // Insert in batches to avoid memory issues and timeouts
          const batchSize = 1; // Process 1 record at a time for maximum stability
          let successCount = 0;
          let failedCount = 0;

          for (let i = 0; i < dataImport.length; i += batchSize) {
            const batch = dataImport.slice(i, i + batchSize);
            const currentBatch = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(dataImport.length / batchSize);

            console.log(
              `Processing batch ${currentBatch}/${totalBatches} (${batch.length} records)`
            );

            try {
              // Process each record individually for maximum stability
              for (const productData of batch) {
                try {
                  // Validate data before inserting
                  if (!productData || typeof productData !== "object") {
                    console.warn("Skipping invalid product data:", productData);
                    failedCount++;
                    continue;
                  }

                  // Create new product instance and save
                  const product = new Product(productData);
                  await product.save();
                  successCount++;
                  console.log(
                    `Successfully imported product ${
                      successCount + failedCount
                    }/${dataImport.length}`
                  );
                } catch (singleError) {
                  console.error("Error inserting single product:", singleError);
                  console.error("Problematic product data:", productData);
                  failedCount++;
                }
              }

              console.log(
                `Completed batch ${currentBatch}/${totalBatches} - Success: ${successCount}, Failed: ${failedCount}`
              );
            } catch (batchError) {
              console.error(
                `Error in batch ${currentBatch}/${totalBatches}:`,
                batchError
              );
              failedCount += batch.length;
            }

            // Add a longer delay between batches to prevent overwhelming the database
            await new Promise((resolve) => setTimeout(resolve, 200));

            // Send progress update to client every 10 batches
            if (currentBatch % 10 === 0) {
              console.log(
                `Progress: ${Math.round(
                  (currentBatch / totalBatches) * 100
                )}% complete`
              );
            }
          }

          console.log(
            `Import completed: ${successCount} successful, ${failedCount} failed`
          );
          resultImport.success = successCount;
          resultImport.failed = failedCount;
        } catch (insertError) {
          console.log("error");
          console.error("Error during bulk insert:", insertError);
          resultImport.success = 0;
          resultImport.failed = dataImport.length;
        }
      }
      // await Promise.all(promises);
      // // Clean up the uploaded file
      fs.unlinkSync(filePath);
      console.log("File cleaned up:", filePath);

      // res.status(200).json({
      //   success: true,
      //   message: "File uploaded and processed successfully",
      //   data: {
      //     fileName: req.file.originalname,
      //     fileSize: req.file.size,
      //     dataType: typeof jsonData,
      //     isArray: Array.isArray(jsonData),
      //     itemCount: Array.isArray(jsonData)
      //       ? jsonData.length
      //       : Object.keys(jsonData).length,
      //   },
      // });
      res.status(200).json({
        success: true,
        message: "File uploaded and processed successfully",
        data: resultImport,
      });
    } catch (error) {
      console.error("Error processing uploaded file:", error);

      // Clean up file if it exists
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
          console.log("File cleaned up after error:", req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }

      res.status(500).json({
        success: false,
        message: "Failed to process uploaded file",
        error: error.message,
        details: error.stack,
      });
    }
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
