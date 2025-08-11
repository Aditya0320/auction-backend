const express = require("express");
const router = express.Router();
const Auction = require("../models/Auction");
const auth = require("../middleware/authMiddleware");
const axios = require("axios");

// GET all auctions
router.get("/", async (req, res) => {
  try {
    const auctions = await Auction.find().populate("seller", "name");
    res.json(auctions);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE auction (POST /api/auctions)
router.post("/", auth, async (req, res) => {
  const { image, startingPrice, endsAt } = req.body;

  if (!image) {
    return res.status(400).json({ message: "Image is required for AI analysis" });
  }

  try {
    // Call Ollama API for image description
    // Change the URL to your ollama API endpoint if different
    const ollamaResponse = await axios.post("http://localhost:11434/run/gemma3:4b", {
      prompt: `Describe this item and suggest a listing title and category for this image: ${image}`,
      max_tokens: 300,
    });

    const aiOutput = ollamaResponse.data.choices?.[0]?.message?.content;

    // Example: parse the AI output if it's JSON or a structured format
    // For simplicity, assume AI responds with plain text like:
    // Title: "Stylish Wooden Chair"
    // Category: Furniture
    // Description: "A beautifully crafted wooden chair..."
    // You may need to parse this string accordingly.

    // Simple parsing example:
    const titleMatch = aiOutput.match(/Title:\s*(.*)/i);
    const categoryMatch = aiOutput.match(/Category:\s*(.*)/i);
    const descriptionMatch = aiOutput.match(/Description:\s*([\s\S]*)/i);

    const title = titleMatch ? titleMatch[1].trim() : "Untitled Item";
    const category = categoryMatch ? categoryMatch[1].trim() : "Miscellaneous";
    const description = descriptionMatch ? descriptionMatch[1].trim() : "No description available.";

    // Create auction with AI generated info
    const auction = new Auction({
      title,
      description,
      image,
      category,
      seller: req.user.id,
      startingPrice,
      currentBid: startingPrice,
      endsAt,
    });

    await auction.save();
    res.status(201).json({ message: "Auction created with AI-generated details", auction });

  } catch (err) {
    console.error("Error calling Ollama AI:", err.message);
    res.status(500).json({ message: "Failed to create auction with AI" });
  }
});

// UPDATE or BID on auction
router.put("/:id", auth, async (req, res) => {
  const { action, title, description, image, endsAt, category, amount } = req.body;

  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    // 🔁 Place a bid
    if (action === "bid") {
      if (amount <= auction.currentBid) {
        return res.status(400).json({ message: "Bid must be higher than current bid" });
      }

      auction.currentBid = amount;
      auction.bids.push({
        bidder: req.user.id,
        amount
      });

      await auction.save();
      return res.json({ message: "Bid placed", auction });
    }

    // ✏️ Seller updating auction
    if (auction.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this auction" });
    }

    if (title) auction.title = title;
    if (description) auction.description = description;
    if (image) auction.image = image;
    if (endsAt) auction.endsAt = endsAt;
    if (category) auction.category = category;

    await auction.save();
    res.json({ message: "Auction updated", auction });

  } catch (err) {
    res.status(500).json({ message: "Error processing request" });
  }
});

module.exports = router;
