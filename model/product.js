const { Schema, model } = require("mongoose");

const productSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  sku: {
    type: String,
    required: true,
    trim: true,
  },
  ean: {
    type: String,
    default: "EAN/UPC code",
  },
  active: {
    type: Boolean,
    default: true,
  },
  is_variant: {
    type: Boolean,
    default: false,
  },
  image: {
    type: String,
    default: "/assets/images/default-product.png",
  },
  url: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  description_long: {
    type: String,
    default: "",
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 999,
  },
  stockstatus: {
    type: Number,
    default: 1,
  },
  stock_flag: {
    type: Number,
    default: 1,
  },
  categories: {
    main: {
      type: String,
      required: true,
    },
    all: [
      {
        type: String,
      },
    ],
  },
  media: [
    {
      sort: {
        type: Number,
        default: 0,
      },
      url: {
        type: String,
        required: true,
      },
      "media-type": {
        type: String,
        default: "image",
      },
    },
  ],
  product_relations: {
    name: {
      type: String,
      default: "parent",
    },
    parent: {
      type: String,
      default: null,
    },
  },
  variants: [
    {
      type: Schema.Types.Mixed,
    },
  ],
  string_facet: [
    {
      facet_name: {
        type: String,
        required: true,
      },
      facet_value: {
        type: String,
        required: true,
      },
    },
  ],
  number_facet: [
    {
      facet_name: {
        type: String,
        required: true,
      },
      facet_value: {
        type: Number,
        required: true,
      },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = model("Product", productSchema);
