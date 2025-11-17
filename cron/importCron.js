import cron from "node-cron";
import mongoose from "mongoose";
import ImportHistory from "@/model/importHistory.js";
import { importJsonFile } from "@/utils/jsonImport.js";
import dotenv from "dotenv";
import fs from "fs";

// Import các handler
import { productImportHandler } from "@/handlers/importHandlers/productHandler.js";
import { categoryImportHandler } from "@/handlers/importHandlers/categoryHandler.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/nodejs";
mongoose.connect(MONGO_URI);

// Map type → handler
const handlerMap = {
  products: productImportHandler,
  categories: categoryImportHandler,
};

cron.schedule("*/1 * * * *", async () => {
  console.log(`[CRON] Checking pending imports at ${new Date().toISOString()}`);

  const pending = await ImportHistory.findOneAndUpdate(
    { status: "pending" },
    { status: "processing" }
  );

  if (!pending) return console.log("[CRON] No pending import found");

  console.log(`[CRON] Processing import type: ${pending.type}`);

  const handler = handlerMap[pending.type];
  if (!handler) {
    console.error(`[CRON] No handler found for type: ${pending.type}`);
    await ImportHistory.findByIdAndUpdate(pending._id, {
      status: "error",
      error: `No handler for type ${pending.type}`,
    });
    return;
  }

  try {
    await importJsonFile({
      filePath: pending.filePath,
      batchSize: 50,
      queueOptions: { concurrency: 3, timeout: 30000, retry: 2 },
      mapValue: handler.mapValue,
      onBatch: handler.onBatch,
      onStart: async () => ({ historyId: pending._id }),
      onComplete: async (summary, meta) => {
        await ImportHistory.findByIdAndUpdate(pending._id, {
          totalRecords: summary.successCount + summary.failedCount,
          successCount: summary.successCount,
          failedCount: summary.failedCount,
          status: "completed",
          completedAt: new Date(),
        });
      },
      onError: async (err, meta) => {
        try {
          if (pending.filePath && fs.existsSync(pending.filePath)) {
            fs.unlinkSync(pending.filePath);
          }
        } catch (_) {}
        await ImportHistory.findByIdAndUpdate(pending._id, {
          status: "error",
          error: err.message,
        });
      },
    });
  } catch (err) {
    console.error("[CRON] Import error:", err.message);
    try {
      if (pending.filePath && fs.existsSync(pending.filePath)) {
        fs.unlinkSync(pending.filePath);
      }
    } catch (_) {}
    await ImportHistory.findByIdAndUpdate(pending._id, {
      status: "error",
      error: err.message,
    });
  }
});
