import { Schema, model } from "mongoose";

const noteSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  body: String,
});

export default model("Admin", noteSchema);
