const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  categories: { type: [String], default: [] }, 
  tags: [
    {
      tag: { type: String, required: true },
      slug: { type: String, required: true }
    }
  ],
  blogcategories: [
    {
      blogcategory: { type: String, required: true },
      slug: { type: String, required: true }
    }
  ],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }]
});

module.exports = mongoose.model("User", userSchema);
