import express from "express";
const router = express.Router();
import ImportHistory from "@/model/importHistory.js";
import { HTTP_STATUS } from "@/constants/http.js";

// GET /import-history?type=products|categories&limit=50
router.get("/import-history", async (req, res) => {
  try {
    const { type, limit = 50 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    const items = await ImportHistory.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json({ success: true, data: items, status: HTTP_STATUS.OK });
  } catch (error) {
    console.error("Error fetching import history:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch import history",
      error: error.message,
    });
  }
});

export default router;
