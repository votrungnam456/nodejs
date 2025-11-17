import { Schema, model } from "mongoose";

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

// Create index for better performance
// categorySchema.index({ slug: 1 });
// categorySchema.index({ name: 1 });
// categorySchema.index({ isActive: 1 });

// Update the updatedAt field before saving
categorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find categories by slug
categorySchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug: slug, isDeleted: false });
};

// Static method to get all active categories
categorySchema.statics.getCategories = function () {
  return this.find({ isDeleted: false }).sort({ name: 1 });
};

export default model("Category", categorySchema);
