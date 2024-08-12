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
          token:token,
          msg:"Login Successfully"
        });
        res.json("Login Successfully");
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
        });

        await user.save();
        console.log("User registered");
        res.status(200).json("User registered successfully");
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

  
module.exports = router;