import express from "express";
const router = express.Router();
import Product from "@/model/product.js";
import ImportHistory from "@/model/importHistory.js";
import fs from "fs";
import path from "path";
import PQueue from "p-queue";
import authMiddleware from "@/middleware/auth.js";
import { HTTP_STATUS } from "@/constants/http.js";
import { MESSAGES } from "@/constants/messages.js";
import { API } from "@/constants/api.js";
import { uploadJson } from "@/utils/upload.js";
import { importJsonFile } from "@/utils/jsonImport.js";

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

// Get all products with filtering and pagination
router.get(API.PRODUCTS.BASE, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      active,
      minStock,
      maxStock,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = { isDeleted: false };

    if (category && category !== "all") {
      filter["categories.main"] = category;
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

    // Add status filter
    if (active !== undefined && active !== "") {
      filter.active = active === "true";
    }

    // Add stock filter
    if (minStock !== undefined || maxStock !== undefined) {
      filter.stock = {};
      if (minStock !== undefined) filter.stock.$gte = parseInt(minStock);
      if (maxStock !== undefined) filter.stock.$lte = parseInt(maxStock);
    }
    // Build sort object with field mapping
    const sort = {};

    // Map frontend field names to database field names
    const fieldMapping = {
      title: "title",
      sku: "sku",
      ean: "ean",
      category: "categories.main",
      active: "active",
      stock: "stock",
      description: "description",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    };

    const dbField = fieldMapping[sortBy] || sortBy;
    sort[dbField] = sortOrder === "desc" ? -1 : 1;

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
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.PRODUCTS_FETCH_FAILED,
      error: error.message,
    });
  }
});

// Get single product by ID
router.get(API.PRODUCTS.BY_ID(":id"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.PRODUCT_NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.PRODUCT_FETCH_FAILED,
      error: error.message,
    });
  }
});

// Create new product
router.post(
  API.PRODUCTS.BASE,
  authMiddleware,
  timeout(600000),
  uploadJson.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.NO_FILE,
      });
    }

    await ImportHistory.create({
      type: "products",
      filename: req.file.originalname,
      size: req.file.size || 0,
      filePath: req.file.path,
      status: "pending",
      createdAt: new Date(),
    });

    return res.json({
      success: true,
      message: MESSAGES.PRODUCT_IMPORT_STARTED,
    });
  }
);

// Update product
router.put(API.PRODUCTS.BY_ID(":id"), authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.PRODUCT_NOT_FOUND,
      });
    }

    res.json({
      success: true,
      message: MESSAGES.PRODUCT_UPDATED,
      data: product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.PRODUCT_UPDATE_FAILED,
      error: error.message,
    });
  }
});

// Delete product
router.delete(API.PRODUCTS.BY_ID(":id"), authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.PRODUCT_NOT_FOUND,
      });
    }

    res.json({
      success: true,
      message: MESSAGES.PRODUCT_DELETED,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.PRODUCT_DELETE_FAILED,
      error: error.message,
    });
  }
});

// Get product categories
router.get(API.PRODUCTS.CATEGORIES, async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.CATEGORIES_FETCH_FAILED,
      error: error.message,
    });
  }
});

// Create single product (JSON body)
router.post(API.PRODUCTS.NEW, authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description = "",
      image = "",
      stock = 0,
      active = true,
      categories = {},
      sku,
      ean,
      isDeleted = false,
    } = req.body || {};

    if (!title || typeof title !== "string") {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const product = new Product({
      title,
      description,
      image,
      stock: Number.isFinite(stock) ? stock : 0,
      active: Boolean(active),
      categories: {
        main: categories?.main || "",
        all: categories?.all || (categories?.main ? [categories.main] : []),
      },
      sku,
      ean,
      isDeleted,
    });

    await product.save();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: MESSAGES.PRODUCT_CREATED,
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.PRODUCT_UPDATE_FAILED,
      error: error.message,
    });
  }
});

export default router;
