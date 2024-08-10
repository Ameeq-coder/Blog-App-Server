const express = require("express");
const User = require("../models/user.model");

const router = express.Router();

router.post("/register", (req, res) => {
    const { email, password, confirmpass } = req.body;

    if (password !== confirmpass) {
        return res.status(400).json({ msg: "Password and confirm password do not match" });
    }

    const user = new User({
        email,
        password,
        confirmpass
    });

    user
        .save()
        .then(() => {
            console.log("User registered");
            res.status(200).json("User registered successfully");
        })
        .catch((err) => {
            res.status(403).json({ msg: err });
        });
});

module.exports = router;
