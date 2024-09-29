const express = require("express");
const bcrypt = require('bcryptjs');
const User = require("../models/user.model");
const config = require('../config');  // Corrected the typo from 'confiq' to 'config'
const jwt=   require("jsonwebtoken")
const middleware= require("../middleware")
const { upload } = require('../cloudinary'); // Cloudinary upload middleware
const Post = require('../models/Post')
const AggregatedPost = require('../models/AggregatedPost'); // Import the AggregatedPost model
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
const axios = require('axios');




const router = express.Router();
router.route("/login").post(async (req, res) => {
    try {
      const result = await User.findOne({ email: req.body.email });
  
      if (!result) {
        return res.status(403).json("Incorrect Email");
      }

      const isMatch = await bcrypt.compare(req.body.password, result.password);
  
      if (isMatch) {
        // TODO: Implement JWT token generation here
     let token=jwt.sign({email:req.body.email},config.key,{
          expiresIn:"24h"
        });
        res.json({
          userId: result._id,  // Including userId in the response
          token:token,
          msg:"Login Successfully"
        });
      } else {
        res.status(403).json("Password is incorrect");
      }
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  });
  


router.get('/createdusers', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users)
    } catch (err){
        console.log('error in login page')
        console.log(err)
    }
})


router.post("/register", async (req, res) => {
    const { email, password, confirmpass } = req.body;

    if (password !== confirmpass) {
        return res.status(400).json({ msg: "Password and confirm password do not match" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            email,
            password: hashedPassword,
            categories: [],
             // Initialize with an empty array
        });

        await user.save();
        console.log("User registered");
        res.status(200).json({ msg: "User registered successfully", userId: user._id });
} catch (err) {
        res.status(403).json({ msg: err.message });
    }
});

router.route("/update/:email").patch( async (req, res) => {
  try {
    // Hash the new password before updating it
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const result = await User.findOneAndUpdate(
      { email: req.params.email },
      { $set: { password: hashedPassword } },
      { new: true } // This option ensures that the updated document is returned
    );

    if (!result) {
      return res.status(404).json({ msg: "User not found" });
    }

    const msg = {
      msg: "Password successfully updated",
      email: req.params.email,
    };
    
    res.status(200).json(msg);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

router.patch("/:userId/categories", async (req, res) => {
  const { userId } = req.params;
  const { categories } = req.body;

  try {
      const user = await User.findById(userId);

      if (!user) {
          return res.status(404).json({ msg: "User not found" });
      }

      user.categories = categories;
      await user.save();

      res.status(200).json({ msg: 'Categories updated successfully', categories: user.categories });

  } catch (err) {
      res.status(500).json({ msg: err.message });
  }
});

// Tags Apis


router.post("/:userId/tags", async (req, res) => {
  const { userId } = req.params;
  const { tag, slug } = req.body;

  console.log("Request body:", req.body);

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User Not Found" });
    }

    console.log("User found:", user);

    const existingTagIndex = user.tags.findIndex(t => t.tag === tag);

    if (existingTagIndex === -1) {
      user.tags.push({ tag, slug });
    } else {
      user.tags[existingTagIndex].slug = slug;
    }

    await user.save();

    console.log("Updated tags:", user.tags);

    res.status(200).json({ msg: 'Tag and slug added/updated successfully', tags: user.tags });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
router.get("/:userId/tags", async (req,res)=>{

const { userId}= req.params;

try{
  const user= await User.findById(userId);

  if(!user){
    return res.status(404).json({msg:"User Not Found"});
  }

  res.status(200).json({tags:user.tags});
}catch(err){
  res.status(500).json({msg:err.message})
}
});
 
router.patch("/:userId/tags", async (req, res) => {
  const { userId } = req.params;
  const { oldTag, newTag, newSlug } = req.body;

  console.log("Request Body:", req.body);

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User Not Found" });
    }

    const tagIndex = user.tags.findIndex(t => t.tag === oldTag);

    if (tagIndex === -1) {
      return res.status(404).json({ msg: "Tag Not Found" });
    }

    user.tags[tagIndex] = { tag: newTag, slug: newSlug };

    // Save the updated user document
    await user.save();

    // Respond with the updated tag
    res.status(200).json({
      msg: 'Tag updated successfully',
      tag: user.tags[tagIndex] // Return the updated tag
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


router.delete("/:userId/tags", async (req, res) => {
  const { userId } = req.params;
  const { tag } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User Not Found" });
    }

    const initialTagCount = user.tags.length;

    // Filter out the tag that matches the provided tag name
    user.tags = user.tags.filter(
      (t) => t.tag.trim().toLowerCase() !== tag.trim().toLowerCase()
    );

    // Check if any tag was removed
    if (user.tags.length < initialTagCount) {
      await user.save();
      return res.status(200).json({ msg: "Tag Deleted Successfully", tags: user.tags });
    } else {
      return res.status(404).json({ msg: "Tag Not Found" });
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
 
/// Blog Categoriesapis

router.post("/:userId/blogcategories", async (req, res) => {
  const { userId } = req.params;
  const { blogcategory, slug } = req.body;

  console.log("Request body:", req.body);

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User Not Found" });
    }

    console.log("User found:", user);

    const existingBlogCategoryIndex = user.blogcategories.findIndex(bc => bc.blogcategory === blogcategory);

    if (existingBlogCategoryIndex === -1) {
      user.blogcategories.push({ blogcategory, slug });
    } else {
      user.blogcategories[existingBlogCategoryIndex].slug = slug;
    }

    await user.save();

    console.log("Updated blog categories:", user.blogcategories);

    res.status(200).json({ msg: 'Blog category and slug added/updated successfully', blogcategories: user.blogcategories });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


router.get("/:userId/blogcategories", async (req,res)=>{

  const { userId}= req.params;
  
  try{
    const user= await User.findById(userId);
  
    if(!user){
      return res.status(404).json({msg:"User Not Found"});
    }
  
    res.status(200).json({blogcategories:user.blogcategories});
  }catch(err){
    res.status(500).json({msg:err.message})
  }
  });

  router.patch("/:userId/blogcategories", async (req, res) => {
    const { userId } = req.params;
    const { oldBlogCategory, newBlogCategory, newSlug } = req.body;
  
    console.log("Request Body:", req.body);
  
    try {
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ msg: "User Not Found" });
      }
  
      const blogCategoryIndex = user.blogcategories.findIndex(bc => bc.blogcategory === oldBlogCategory);
  
      if (blogCategoryIndex === -1) {
        return res.status(404).json({ msg: "Blog category Not Found" });
      }
  
      user.blogcategories[blogCategoryIndex] = { blogcategory: newBlogCategory, slug: newSlug };
  
      // Save the updated user document
      await user.save();
  
      // Respond with the updated blog category
      res.status(200).json({
        msg: 'Blog category updated successfully',
        blogcategory: user.blogcategories[blogCategoryIndex] // Return the updated blog category
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  });

  router.delete("/:userId/blogcategories", async (req, res) => {
    const { userId } = req.params;
    const { blogcategory } = req.body;
  
    try {
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ msg: "User Not Found" });
      }
  
      const initialBlogCategoryCount = user.blogcategories.length;
  
      // Filter out the blog category that matches the provided blogcategory name
      user.blogcategories = user.blogcategories.filter(
        (bc) => bc.blogcategory.trim().toLowerCase() !== blogcategory.trim().toLowerCase()
      );
  
      // Check if any blog category was removed
      if (user.blogcategories.length < initialBlogCategoryCount) {
        await user.save();
        return res.status(200).json({ msg: "Blog category Deleted Successfully", blogcategories: user.blogcategories });
      } else {
        return res.status(404).json({ msg: "Blog category Not Found" });
      }
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  });
  
// blogpost

router.post('/:userId/blogpost', upload.single('featuredImage'), async (req, res) => {
  const { userId } = req.params;
  const { title, slug, categories, tags, content } = req.body;

  try {
      // Find the user by ID
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ msg: "User not found" });
      }

      // Assuming the User model has a field for channelName
      const channelName = user.channelName;
      if (!channelName) {
          return res.status(400).json({ msg: "Channel name not found for this user" });
      }

      // Create a new Post
      const post = new Post({
          userId,
          title,
          categories: categories.split(','), // Splitting categories string into an array
          tags: tags.split(','), // Splitting tags string into an array
          content,
          slug,
          channelName, // Adding channelName fetched from user
          featuredImage: req.file.path // Path for uploaded image
      });

      // Save the post
      await post.save();

      // Add post to the user's posts array
      user.posts.push(post._id);
      await user.save();

      // Save to AggregatedPost collection
      const aggregatedPost = new AggregatedPost({
          userId,
          title,
          categories: categories.split(','),
          tags: tags.split(','),
          content,
          slug,
          channelName, // Adding channelName fetched from user
          featuredImage: req.file.path
      });

      await aggregatedPost.save();

      res.status(201).json({ msg: "Post Created Successfully", post });
  } catch (err) {
      res.status(500).json({ msg: err.message });
  }
});


router.get('/allposts', async (req, res) => {
  try {
      const posts = await AggregatedPost.find();
      res.status(200).json(posts);
  } catch (err) {
      res.status(500).json({ msg: err.message });
  }
});

  // In your user.js or relevant routes file
router.get('/:userId/blogpost', async (req, res) => {
  const { userId } = req.params;
  
  try {
      const posts = await AggregatedPost.find({ userId: userId });
      if (posts.length === 0) {
          return res.status(404).json({ msg: "No posts found for this user" });
      }
      res.status(200).json(posts);
    } catch (err) {
      res.status(500).json({ msg: err.message });
  }
});


// Fetch posts by category
  router.get('/posts/category/:category', async (req, res) => {
    const { category } = req.params;

    try {
      // Find posts that include the specified category in the categories array
      const posts = await AggregatedPost.find({ categories: { $in: [category] } });

      // Check if posts were found
      if (posts.length === 0) {
        return res.status(404).json({ msg: "No posts found for this category" });
      }

      res.status(200).json(posts);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  });



router.get("/:userId/categories", async (req,res)=>{
const { userId }=req.params;
try{
  const user = await User.findById(userId).select('categories'); // Only select the 'categories' field

  if (!user) {
    return res.status(404).json({ msg: "User not found" });
  }

  res.status(200).json({ categories: user.categories });
} catch (err){
  res.status(500).json({ msg: err.message });
}

});

// GET route to search for posts by title
router.get('/search', async (req, res) => {
  let { title } = req.query;

  // Check if title is provided and is a string
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ msg: "Title parameter is required and should be a string" });
  }

  try {
    // Trim the title to remove any extra whitespace
    title = title.trim();

    // Search for posts with titles that match the query, using case-insensitive regex
    const posts = await Post.find({ title: { $regex: title, $options: 'i' } });

    if (posts.length === 0) {
      return res.status(404).json({ msg: "No posts found" });
    }

    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


router.get('/download/:postId/:userId', async (req, res) => {
  const { postId, userId } = req.params;

  try {
    const post = await AggregatedPost.findById(postId);
    const user = await User.findById(userId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const doc = new PDFDocument({
      autoFirstPage: false // Disable the default first page so we can control page dimensions
    });

    let filename = `${post.title}.pdf`;
    filename = encodeURIComponent(filename);

    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    // If there's a featured image, render it first
    if (post.featuredImage) {
      try {
        const imageResponse = await axios.get(post.featuredImage, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');
        
        // Add a new page for the image (dynamically calculated)
        doc.addPage({
          size: 'A4', // Standard size, can adjust dynamically if needed
          margins: { top: 0, bottom: 50, left: 50, right: 50 }
        });


        doc.moveDown(3);
        // Insert the image at the top, allowing it to fit within 500px width
        doc.image(imageBuffer, {
          fit: [500, 300],   // Max width of 500 and proportional height
          align: 'center',   // Horizontally center the image
          // valign: 'top'      // Vertically align to the top
        });

        // Move the cursor down after the image
        doc.moveDown(25);
      } catch (imageErr) {
        console.error("Failed to load featured image:", imageErr);
        doc.addPage(); // Add a page if there's no image to load
        doc.fontSize(16).text('Failed to load featured image.', { align: 'center' });
        doc.moveDown(1);
      }
    }

    // Add the title directly below the image or in case of failure to load image
    doc.fontSize(25).text(post.title, { align: 'center' });
    doc.moveDown(0.5); // Small margin after the title

    // Add categories immediately after the title
    doc.fontSize(20).text('Categories: ' + post.categories.join(', '), { align: 'left' });
    doc.moveDown(0.5); // Small margin after the categories

    // Add content
    doc.fontSize(16).text('Content:', { underline: true });
    doc.fontSize(14).text(post.content, { align: 'left' });

    // Finish and send the document
    doc.pipe(res);
    doc.end();

    // Log the download for the user
    user.downloads = user.downloads || [];
    user.downloads.push({
      postId: post._id,
      title: post.title,
      categories: post.categories,
      content: post.content,
      featuredImage: post.featuredImage,
      downloadedAt: new Date()
    });

    await user.save();
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// API to fetch a specific post by its ID
router.get('/post/:postId', async (req, res) => {
  const { postId } = req.params;

  try {
    // Find the post by ID in the AggregatedPost collection (or Post collection, depending on your use case)
    const post = await AggregatedPost.findById(postId); // You can also use Post.findById if you're using the Post model

    // Check if the post exists
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Return the post data in the response
    res.status(200).json(post);
  } catch (err) {
    // Handle any errors that may occur, such as invalid postId format or database issues
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
});


// favorites apis


router.post('/:userId/favorites/:postId', async (req, res) => {
  const { userId, postId } = req.params;

  try {
    // Find the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check if the post exists
    const post = await AggregatedPost.findById(postId).populate('categories tags'); // Populate category and tags if they are referenced
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if the post is already in the user's favorites
    if (user.favorites.includes(postId)) {
      return res.status(400).json({ msg: "Post is already in favorites" });
    }

    // Add the post to the user's favorites
    user.favorites.push(postId);
    await user.save();

    // Respond with post details
    const postDetails = {
      id: post._id,
      title: post.title,
      content: post.content,
      featuredImage: post.featuredImage,  // Assuming post.image is the field for the image URL
      categories: post.categories,
      tags: post.tags,
    };

    res.status(200).json({ msg: "Post added to favorites", post: postDetails });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


router.delete('/:userId/favorites/:postId', async (req,res)=>{

  const { userId, postId } = req.params;


try{

const user= await User.findById(userId);
if(!user){
  return res.status(404).json({msg:"User Not Found"});
}


const isFavorite=user.favorites.includes(postId);
if (!isFavorite) {
  return res.status(400).json({ msg: "Post is not in favorites" });
}
user.favorites= user.favorites.filter(favPostId => favPostId.toString() !== postId);
await user.save();


res.status(200).json({ msg: "Post removed from favorites" });

}catch (err) {
    res.status(500).json({ msg: err.message });
  }


});


router.post('/channels/signup', async (req, res) => {
  const { channelName, password } = req.body;

  try {
    // Check if a channel with the same name already exists
    const existingChannel = await User.findOne({ channelName });
    if (existingChannel) {
      return res.status(400).json({ msg: "Channel name already exists" });
    }

    // Create a new channel (creator)
    const hashedPassword = await bcrypt.hash(password, 10);
    const newChannel = new User({
      channelName,
      password: hashedPassword,  // Password is hashed
      role: 'creator'
    });

    // Save the channel to the database
    await newChannel.save();
    res.status(201).json({ msg: "Channel created successfully", channelId: newChannel._id });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post('/channel/login', async (req, res) => {
  const { channelName, password } = req.body;

  try {
    // Find the channel by channelName and role
    const channel = await User.findOne({ channelName, role: 'creator' });
    if (!channel) {
      return res.status(404).json({ msg: "Channel not found" });
    }

    // Check if the password matches (use bcrypt for password comparison)
    const isMatch = await bcrypt.compare(password, channel.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // On successful login, respond with channel information
    res.status(200).json({
      msg: "Channel logged in successfully",
      channelId: channel._id,
      channelName: channel.channelName,
      role: channel.role,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


router.post('/post/:postId/view', async (req, res) => {
  const { postId } = req.params;

  try {
    // Find the post by its ID
    const post = await AggregatedPost.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Increment the views count by 1
    post.views += 1;
    await post.save();

    res.status(200).json({ msg: "Post viewed", views: post.views });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});




module.exports = router;