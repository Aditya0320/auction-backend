const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ["buyer", "seller"],
    default: "buyer"
  },
  phone: String,
  location: String,
  watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Auction" }]
});

module.exports = mongoose.model("User", userSchema);
 
