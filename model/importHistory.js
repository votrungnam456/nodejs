import { Schema, model } from "mongoose";

const importHistorySchema = new Schema({
  type: { type: String, enum: ["products", "categories"], required: true },
  filename: { type: String, required: true },
  size: { type: Number, default: 0 },
  totalRecords: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "error"],
    default: "pending",
  },
  filePath: { type: String },
  error: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date },
  updatedAt: { type: Date, default: Date.now },
});

importHistorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default model("ImportHistory", importHistorySchema);
