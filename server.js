const express = require("express");
const cookieParser = require("cookie-parser");
const axios = require("axios");

const app = express();
const PORT = 3000;

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage for access token and user ID
let accessToken = "";
let userId = "";

// Automatically login user when accessing /admin
app.get("/admin", async (req, res) => {
  // Check if user is already logged in
  if (req.cookies.loggedIn && accessToken && userId) {
    return res.redirect("http://localhost:8080/admin");
  }

  try {
    // Send login request to the specified API
    const loginResponse = await axios.post("https://bgc.sixorbit.com/", null, {
      params: {
        urlq: "service",
        version: "1.0",
        key: "123",
        task: "login",
        email: "dev@bgc.com",
        password: "1234",
        app_flag: "2",
        network_ip: "10.0.2.16",
      },
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }) // Disable SSL verification
    });

    // Extract access_token and user_id from the response
    if (loginResponse.data.success) {
      accessToken = loginResponse.data.data.access_token;
      userId = loginResponse.data.data.user_id;

      console.log('Access Token: ' + accessToken);
      console.log('User ID: ' + userId);

      // Set a cookie to mark the user as logged in
      res.cookie("loggedIn", true, { httpOnly: true });
      res.cookie("access_token", accessToken);
      res.cookie("userId", userId);

      // Redirect to Decap CMS dashboard
      return res.redirect("http://localhost:8080/admin");
    } else {
      return res.status(400).json({ error: "Login failed, please check your credentials." });
    }
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ error: "Login failed, please try again." });
  }
});

// API endpoint to fetch variations using the stored access token and user ID
app.get("/variations", async (req, res) => {
  if (!accessToken || !userId) {
    return res.status(401).json({ success: false, message: "User is not logged in." });
  }

  const apiUrl = `https://bgc.sixorbit.com/?urlq=service&version=1.0&key=123&task=variation/fetch&user_id=${userId}&access_token=${accessToken}&last_updated&limit=&searchtext&limit_bit=0`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (data.success) {
      return res.json(data);
    } else {
      return res.status(400).json({ success: false, message: data.message });
    }
  } catch (error) {
    console.error("Error fetching variations:", error);
    return res.status(500).json({ success: false, message: "Error fetching variations." });
  }
});

// API endpoint to fetch unique categories using the stored access token and user ID
app.get("/categories", async (req, res) => {
  if (!accessToken || !userId) {
    return res.status(401).json({ success: false, message: "User is not logged in." });
  }

  const apiUrl = `http://bgc.sixorbit.com/?urlq=service&version=1.0&key=123&task=variation/fetch&user_id=${userId}&access_token=${accessToken}&last_updated&limit=&searchtext&catid=410011151`;

  try {
    const response = await axios.get(apiUrl);
    console.log("API Response:", response.data);
    const data = response.data;

    if (data.success) {
      // Use a Set to ensure unique categories
      const uniqueCategories = new Set(data.data.categories);

      return res.json(data);
    } else {
      return res.status(400).json({ success: false, message: data.message });
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ success: false, message: "Error fetching categories." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
