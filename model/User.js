// User.js

const mongoose = require("mongoose");

// Define a schema for the user data
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// Define a model for the user data
const User = mongoose.model("User", userSchema);

// Export the User model
module.exports = User;
