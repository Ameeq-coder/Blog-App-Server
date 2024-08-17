const express = require("express");
const bcrypt = require('bcryptjs');
const User = require("../models/user.model");
const config = require('../config');  // Corrected the typo from 'confiq' to 'config'
const jwt=   require("jsonwebtoken")
const middleware= require("../middleware")


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
 



module.exports = router;