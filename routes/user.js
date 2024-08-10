const express = require("express");
const bcrypt = require('bcryptjs');
const User = require("../models/user.model");

const router = express.Router();

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

module.exports = router;
