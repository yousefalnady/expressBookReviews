const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const bcrypt = require('bcrypt');  // For password hashing and comparison
const regd_users = express.Router();

let users = []; // Array to store registered users

// Check if the username is valid (i.e., it already exists in the array)
const isValid = (username) => {
  // Return true if the username exists in the users array, false otherwise
  return users.some(user => user.username === username);
};

// Check if the username and password match the ones in records
const authenticatedUser = (username, password) => {
  const user = users.find(user => user.username === username);
  
  // If the user exists and the password matches the stored hashed password, return true
  if (user && bcrypt.compareSync(password, user.password)) {
    return true;
  }

  // Otherwise, return false
  return false;
};

//only registered users can login
regd_users.post("/login", (req,res) => {
  const { username, password } = req.body;

  // Check if username and password are provided
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  // Check if the username and password match
  if (!authenticatedUser(username, password)) {
    return res.status(400).json({ error: 'Invalid username or password.' });
  }

  // Generate a JWT token if authentication is successful
  const token = jwt.sign({ username }, "access", { expiresIn: '1h' });

  // Store the token in the session
  req.session.authorization = {
    accessToken: token
  };

  res.status(200).json({ message: 'Login successful', token });
});


// Login Route
regd_users.post('/customer/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = users.find(user => user.username === username);
  if (!user) {
    return res.status(400).json({ error: 'Invalid username or password.' });
  }

  // Compare the password with the hashed password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ error: 'Invalid username or password.' });
  }

  // Generate a JWT token
  const token = jwt.sign({ username: user.username }, "access", { expiresIn: '1h' }); // Secret key must match

  // Store the token in the session
  req.session.authorization = {
    accessToken: token
  };

  res.status(200).json({ message: 'Login successful', token });
});




// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const { review } = req.body;
  const username = req.session.authorization.username;

  // Check if the book exists
  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Initialize reviews if not present
  if (!book.reviews) {
    book.reviews = {};
  }

  // Check if the user has already reviewed this book
  if (book.reviews[username]) {
    // Update the existing review
    book.reviews[username] = review;
    return res.status(200).json({ message: "Review updated successfully." });
  } else {
    // Add a new review
    book.reviews[username] = review;
    return res.status(201).json({ message: "Review added successfully." });
  }
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const username = req.session.authorization.username;

  // Check if the book exists
  const book = books[isbn];
  if (!book) {
      return res.status(404).json({ message: "Book not found" });
  }

  // Check if the book has reviews
  if (!book.reviews) {
      return res.status(400).json({ message: "No reviews found for this book" });
  }

  // Check if the user has a review for this book
  if (!book.reviews[username]) {
      return res.status(400).json({ message: "You have no review for this book" });
  }

  // Delete the review
  delete book.reviews[username];
  return res.status(200).json({ message: "Review deleted successfully." });
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
