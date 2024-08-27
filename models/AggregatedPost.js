const mongoose = require('mongoose');

const aggregatedPostSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    categories: [{ type: String, required: true }],
    tags: [{ type: String, required: true }],
    content: { type: String, required: true },
    featuredImage: { type: String, required: true },
     // URL from Cloudinary
    createdAt: { type: Date, default: Date.now }
});

// Create the AggregatedPost model
const AggregatedPost = mongoose.model('AggregatedPost', aggregatedPostSchema);

module.exports = AggregatedPost;
