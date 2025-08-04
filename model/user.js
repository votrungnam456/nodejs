const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  name: String,
  email: String,
  age: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model("User", userSchema);
