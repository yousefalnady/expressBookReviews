const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const bcrypt = require('bcrypt');
const saltRounds = 10; // Number of rounds to use for hashing

public_users.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Check if username and password are provided
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  // Check if the username already exists
  const userExists = users.find(user => user.username === username);
  if (userExists) {
    return res.status(400).json({ error: 'Username already exists.' });
  }

  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Store the new user with hashed password
  users.push({ username, password: hashedPassword }); // In practice, password should be hashed!
  res.status(201).json({ message: 'User registered successfully.' });
});



// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  try {
    const booksString = JSON.stringify({ books }, null, 4);
    return res.status(200).send(booksString);
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  try {
    // Check if the called ISBN number is available in database
    const isbn = req.params.isbn;
    if (isbn in books) {
      // Select specified book and display it to user
      const bookByISBN = books[isbn];
      return res.status(200).send(JSON.stringify(bookByISBN));
    } else {
      // Send error message that book isn't available in db
      return res.status(404).send("Book not available");
    }
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
});

// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  try {
    // Create an empty array to push results into
    let bookByAuthor = [];
    // Looping over books object and pushing books by author into array
    for (const [key, value] of Object.entries(books)) {
      if (value.author === req.params.author) {
        bookByAuthor.push(value);
      }
    }
    // Display the result to user
    return res.status(200).json(bookByAuthor);
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  try {
    let bookByTitle;
    for (const [key, value] of Object.entries(books)) {
      if (value.title === req.params.title) {
        bookByTitle = value;
      }
    }
    return res.status(200).json(bookByTitle);
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
});

// Get book review
public_users.get('/review/:isbn', async function (req, res) {
  try {
    // Get specified book
    const bookByISBN = books[req.params.isbn];
    if (bookByISBN) {
      // Get book reviews
      const bookReviews = bookByISBN.reviews;
      return res.status(200).json(bookReviews);
    } else {
      return res.status(404).send("Book not available");
    }
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
});


module.exports.general = public_users;
