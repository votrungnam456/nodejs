const express = require("express");
const axios = require("axios");
const router = express.Router();
const { connectDB } = require("../connectDB");
const User = require("../model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Get all users
router.get("/user", async (req, res, next) => {
  try {
    const data = [];
    const response = await axios.get("https://jsonplaceholder.typicode.com/users");
    // console.log(response.data);
    response.data.forEach((user) => {
      const objectData = {
        id: user.id,
        name: user.name,
        email: user.email,
      };
      data.push(objectData);
    });
    res.json(data);
  } catch (error) {
    console.error("API Error:", error.message);
    const customError = new Error("Failed to fetch user data");
    customError.status = 503;
    customError.details = error.message;
    next(customError);
  }
});

// Get user by ID
router.get("/user/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = [];
    
    if (!id) {
      const error = new Error("User ID is required");
      error.status = 400;
      return next(error);
    }
    
    const response = await axios.get("https://jsonplaceholder.typicode.com/users");
    const findData = response.data.find((user) => user.id == id);
    
    if (!findData) {
      const error = new Error("User not found");
      error.status = 404;
      return next(error);
    }
    
    data.push(findData);
    res.json(data);
  } catch (error) {
    console.error("API Error:", error.message);
    const customError = new Error("Failed to fetch user data");
    customError.status = 503;
    customError.details = error.message;
    next(customError);
  }
});


router.post("/user/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    // Basic validation
    if (!username || !password) {
      return res.status(400).json({
        status: 400,
        message: "Username and password are required"
      });
    }

    console.log("Login attempt:", { username, password });

    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(401).json({
        status: 401,
        message: "Invalid username or password"
      });
    }
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 401,
        message: "Invalid username or password"
      });
    }
    const token = jwt.sign(
      { userId: user._id }, // Payload
      process.env.JWT_SECRET,         // Khóa bí mật
      { expiresIn: "1h" }   // Tùy chọn (token sống 1 giờ)
    );
    res.json({
      status: 200,
      message: "Login successful",
      token: token
    });
    // // Demo login logic (replace with actual authentication)
    // if (username === 'admin' && password === 'password123') {
    //   res.json({
    //     status: 200,
    //     message: "Login successful",
    //     user: {
    //       username: username,
    //       role: "admin"
    //     }
    //   });
    // } else {
    //   res.status(401).json({
    //     status: 401,
    //     message: "Invalid username or password"
    //   });
    // }
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      status: 500,
      message: "Internal server error"
    });
  }
});

router.post("/user/signup", async (req, res, next) => {
  try {
    const { username, password, firstName, lastName, email } = req.body;
    
    // Basic validation
    if (!username || !password || !firstName || !lastName || !email) {
      return res.status(400).json({
        status: 400,
        message: "All fields are required"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username: username }, { email: email }] 
    });
    
    if (existingUser) {
      return res.status(409).json({
        status: 409,
        message: "Username or email already exists"
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const user = new User({
      username,
      password: hash,
      firstName: firstName,
      lastName: lastName,
      email: email
    });
    await user.save();
    res.status(201).json({
      status: 201,
      message: "Account created successfully",
      user: {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      status: 500,
      message: "Internal server error"
    });
  }
});

module.exports = router; 