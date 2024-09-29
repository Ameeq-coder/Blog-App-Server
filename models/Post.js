const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    categories: [{ type: String, required: true }],
    tags: [{ type: String, required: true }],
    content: { type: String, required: true },
    featuredImage: { type: String, required: true },
    // URL from Cloudinary
    createdAt: { type: Date, default: Date.now },
    channelName: { type: String, required: true }, // Adding channelName to schema
    views: { type: Number, default: 0 },  // Add views field to track post views

});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
