const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/", async (req, res) => {
  const { type, name, email, password, role } = req.body;

  if (!type || !email || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // =====================
    // 🚀 REGISTER
    // =====================
    if (type === "register") {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role: role || "buyer",
      });

      await newUser.save();

      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      return res.status(201).json({ token, user: newUser });
    }

    // =====================
    // 🔐 LOGIN
    // =====================
    if (type === "login") {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid password" });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      return res.status(200).json({ token, user });
    }

    // =====================
    // ❌ Invalid type
    // =====================
    return res.status(400).json({ message: "Invalid request type" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
 
