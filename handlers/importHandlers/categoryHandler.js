import Category from "@/model/category.js";

export const categoryImportHandler = {
  mapValue: (value) => {
    if (!value || !value._source) return null;
    return {
      ...value._source,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
  onBatch: async (items) => {
    await Category.insertMany(items, { ordered: false, lean: true });
  },
};
