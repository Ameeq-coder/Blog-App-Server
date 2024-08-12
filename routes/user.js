const express = require("express");
const bcrypt = require('bcryptjs');
const User = require("../models/user.model");

const router = express.Router();

router.get('/login', async (req, res) => {
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
router.route("/update/:email").patch(async (req, res) => {
    try {
      const result = await User.findOneAndUpdate(
        { email: req.params.email },
        { $set: { password: req.body.hashedPassword } },
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