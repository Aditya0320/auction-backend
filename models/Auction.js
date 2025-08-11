const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  image: String,
  category: String,

  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  startingPrice: { type: Number, required: true },
  currentBid: { type: Number, default: 0 },

  bids: [
    {
      bidder: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      amount: Number,
      time: { type: Date, default: Date.now }
    }
  ],

  createdAt: { type: Date, default: Date.now },
  endsAt: { type: Date, required: true }
});

module.exports = mongoose.model("Auction", auctionSchema);
 
