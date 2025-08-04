const { Schema, model } = require("mongoose");

const noteSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  body: String,
});

module.exports = model("Admin", noteSchema);
