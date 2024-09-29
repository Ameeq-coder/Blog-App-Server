const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: { type: String, unique: true, sparse: true },  // Email for readers (users)
  password: { type: String, required: true },
  channelName: { type: String, unique: true, sparse: true },  // Channel Name for creators (channels)
  
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
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],

  downloads: [
    {
      postId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post', 
        required: true 
      },
      title: { 
        type: String, 
        required: true 
      },
      categories: [String],  // Categories associated with the downloaded post
      content: { 
        type: String 
      },
      featuredImage: { 
        type: String 
      },
      downloadedAt: { 
        type: Date, 
        default: Date.now 
      }
    }
  ],

  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],  // Add a field to store favorite posts
  
  role: {
    type: String,
    enum: ['reader', 'creator'],
    required: true,
    default: 'reader'
  }
});

module.exports = mongoose.model("User", userSchema);
