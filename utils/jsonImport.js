import fs from "fs";
import { pipeline } from "stream";
import StreamArray from "stream-json/streamers/StreamArray.js";
import PQueue from "p-queue";
import { HTTP_STATUS } from "@/constants/http.js";

export async function importJsonFile(options, res) {
  const {
    filePath,
    batchSize = 50,
    queueOptions = { concurrency: 3, timeout: 30000, retry: 2 },
    mapValue, // (raw) => item | null
    onBatch, // async (items[]) => void
    onCompleteMessage = "Import completed",
    onStart, // async (meta) => any
    onComplete, // async (summary, meta) => void
    onError, // async (error, meta) => void
    meta = {}, // passthrough data
  } = options;

  if (!filePath) {
    if (res) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "No file uploaded",
      });
    }
    throw new Error("No file uploaded");
  }

  const jsonStream = StreamArray.withParser();
  const fileStream = fs.createReadStream(filePath);
  const queue = new PQueue(queueOptions);

  let batch = [];
  let successCount = 0;
  let failedCount = 0;
  let streamEnded = false;

  const startTime = Date.now();

  const processBatch = async (items) => {
    if (!items || items.length === 0) return;
    await onBatch(items);
    successCount += items.length;
  };

  const startMeta = onStart ? await onStart({ filePath, ...meta }) : meta;

  return new Promise((resolve, reject) => {
    pipeline(fileStream, jsonStream, (err) => {
      if (err) {
        try {
          fs.unlinkSync(filePath);
        } catch (_) {}
        if (onError) onError(err, startMeta).catch(() => {});
        if (res) {
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to process file",
            error: err.message,
          });
        }
        return reject(err);
      }
    });

    jsonStream.on("data", ({ value }) => {
      const mapped = mapValue ? mapValue(value) : value;
      if (!mapped) {
        failedCount++;
        return;
      }
      batch.push(mapped);
      if (batch.length >= batchSize) {
        const toInsert = [...batch];
        batch = [];
        queue
          .add(() => processBatch(toInsert))
          .catch(() => {
            failedCount += toInsert.length;
          });
      }
    });

    jsonStream.on("end", () => {
      if (batch.length > 0) {
        const last = [...batch];
        batch = [];
        queue
          .add(() => processBatch(last))
          .catch(() => {
            failedCount += last.length;
          });
      }
      streamEnded = true;
    });

    const checkFinish = setInterval(async () => {
      if (streamEnded && queue.size === 0 && queue.pending === 0) {
        clearInterval(checkFinish);
        try {
          fs.unlinkSync(filePath);
        } catch (_) {}
        const totalTime = Date.now() - startTime;
        const summary = {
          success: true,
          message: onCompleteMessage,
          data: {
            successCount,
            failedCount,
            totalTime: `${totalTime}ms`,
            averageTimePerRecord:
              successCount + failedCount > 0
                ? totalTime / (successCount + failedCount)
                : 0,
          },
        };
        if (onComplete)
          await onComplete(
            {
              ...summary.data,
              message: onCompleteMessage,
            },
            startMeta
          ).catch(() => {});
        if (res) {
          res.json(summary);
          resolve();
        } else {
          resolve(summary);
        }
      }
    }, 500);
  });
}
