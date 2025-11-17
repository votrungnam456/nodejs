import express from "express";
const router = express.Router();
import Category from "@/model/category.js";
import fs from "fs";
import path from "path";
import { pipeline } from "stream";
import StreamArray from "stream-json/streamers/StreamArray.js";
import PQueue from "p-queue";
import { uploadJson } from "@/utils/upload.js";
import { importJsonFile } from "@/utils/jsonImport.js";
import { HTTP_STATUS } from "@/constants/http.js";
import { MESSAGES } from "@/constants/messages.js";
import { API } from "@/constants/api.js";
import ImportHistory from "@/model/importHistory.js";

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

// Multer moved to utils/upload.js

// Get all categories with filtering and pagination
router.get(API.CATEGORIES.BASE, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get categories with pagination
    const categories = await Category.find(filter)
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
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.CATEGORIES_FETCH_FAILED,
      error: error.message,
    });
  }
});

// Get single category by ID
// Get all active categories (for dropdowns, etc.) - keep BEFORE :id route to avoid clash
// router.get("/categories/active", async (req, res) => {
//   try {
//     const categories = await Category.getActiveCategories();
//     res.json({
//       success: true,
//       data: categories,
//     });
//   } catch (error) {
//     console.error("Error fetching active categories:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch active categories",
//       error: error.message,
//     });
//   }
// });

router.get(API.CATEGORIES.BY_ID(":id"), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.CATEGORY_NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.CATEGORY_FETCH_FAILED,
      error: error.message,
    });
  }
});

// Get category by slug
// Slug route should also be before generic :id if patterns could overlap
router.get(API.CATEGORIES.BY_SLUG(":slug"), async (req, res) => {
  try {
    const category = await Category.findBySlug(req.params.slug);

    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.CATEGORY_NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category by slug:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.CATEGORY_FETCH_FAILED,
      error: error.message,
    });
  }
});

// Create new category
router.post(API.CATEGORIES.BASE, async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: MESSAGES.CATEGORY_CREATED,
      data: category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.CATEGORY_FETCH_FAILED,
      error: error.message,
    });
  }
});

// Import categories from JSON file
router.post(
  API.CATEGORIES.IMPORT,
  uploadJson.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.NO_FILE,
      });
    }

    await ImportHistory.create({
      type: "categories",
      filename: req.file.originalname,
      size: req.file.size || 0,
      filePath: req.file.path,
      status: "pending",
      createdAt: new Date(),
    });

    return res.json({
      success: true,
      message: MESSAGES.CATEGORY_IMPORT_STARTED,
    });
  }
);

// Update category
router.put(API.CATEGORIES.BY_ID(":id"), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.CATEGORY_NOT_FOUND,
      });
    }

    res.json({
      success: true,
      message: MESSAGES.CATEGORY_UPDATED,
      data: category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.CATEGORY_FETCH_FAILED,
      error: error.message,
    });
  }
});

// Delete category
router.delete(API.CATEGORIES.BY_ID(":id"), async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.CATEGORY_NOT_FOUND,
      });
    }

    res.json({
      success: true,
      message: MESSAGES.CATEGORY_DELETED,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.CATEGORY_FETCH_FAILED,
      error: error.message,
    });
  }
});
export default router;
