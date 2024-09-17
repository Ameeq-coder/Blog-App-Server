const express = require("express");
const bcrypt = require('bcryptjs');
const User = require("../models/user.model");
const config = require('../config');  // Corrected the typo from 'confiq' to 'config'
const jwt=   require("jsonwebtoken")
const middleware= require("../middleware")
const { upload } = require('../cloudinary'); // Cloudinary upload middleware
const Post = require('../models/Post')
const AggregatedPost = require('../models/AggregatedPost'); // Import the AggregatedPost model

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
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ msg: "User not found" });
      }

      const post = new Post({
          userId,
          title,
          categories: categories.split(','),
          tags: tags.split(','),
          content,
          slug,
          featuredImage: req.file.path
      });

      await post.save();
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
      const posts = await Post.find({ userId: userId });
      if (posts.length === 0) {
          return res.status(404).json({ msg: "No posts found for this user" });
      }
      res.status(200).json(posts);
  } catch (err) {
      res.status(500).json({ msg: err.message });
  }
});








module.exports = router;