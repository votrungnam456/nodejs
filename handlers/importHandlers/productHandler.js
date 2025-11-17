import Product from "@/model/product.js";

export const productImportHandler = {
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
    await Product.insertMany(items, { ordered: false, lean: true });
  },
};
