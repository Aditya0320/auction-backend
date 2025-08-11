const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

// GET user profile
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("watchlist");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE profile or toggle watchlist
router.put("/:id", auth, async (req, res) => {
  const { action, phone, location, name, auctionId, mode } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (action === "watchlist") {
      if (!auctionId) return res.status(400).json({ message: "auctionId required" });

      const alreadyIn = user.watchlist.includes(auctionId);
      if (mode === "add" && !alreadyIn) {
        user.watchlist.push(auctionId);
      } else if (mode === "remove" && alreadyIn) {
        user.watchlist = user.watchlist.filter(id => id.toString() !== auctionId);
      }

    } else if (action === "profile") {
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (location) user.location = location;
    }

    await user.save();
    res.json({ message: "User updated", user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

