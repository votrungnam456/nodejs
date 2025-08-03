const express = require("express");
const connectDB = require("./connectDB.js");
const app = express();
const port = process.env.PORT || 3000;
const hostname = process.env.HOST_NAME || "localhost";
const path = require("path");
// const { connectDB } = require("./connectDB.js");

require("dotenv").config();

app.set("views", "./src/views/");
app.set("view engine", "ejs");

// console.log(process.env);

app.use(express.static(path.join(__dirname, "public")));

// await connectDB().then(() => console.log("Database connected successfully"));
// connectDB();
connectDB
  .connectDB()
  .then(() => {
    console.log("Database connected");
    // Các lệnh tiếp theo của bạn
  })
  .catch((err) => {
    console.error("Failed to connect to database", err);
  });

app.get("/", (req, res) => {
  // res.send(Buffer.from("whoop"));
  // res.send({ some: "json" });
  // res.send("Hello World!");
  // res.send("<p>some html</p>");
  // res.status(404).send("Sorry, we cannot find that!");
  // res.status(500).send({ error: "something blew up" });
  // path.basename("./index.html");
  res.sendFile(path.join(__dirname, "index.html"));
  // res.send(`<img src="/assets/images/img.png" alt="Logo">`);
});

app.get("/ejs", (req, res) => {
  res.render("example.ejs");
});

app.listen(port, hostname, () => {
  console.log(`Example app listening on port ${port}`);
});
