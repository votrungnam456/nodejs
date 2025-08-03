const express = require("express");
const connectDB = require("./connectDB.js");
const app = express();
const port = process.env.PORT || 3000;
const hostname = process.env.HOST_NAME || "localhost";
const path = require("path");
const axios = require("axios");
// const { connectDB } = require("./connectDB.js");

require("dotenv").config();

app.set("views", "./src/views/");
app.set("view engine", "ejs");

// console.log(process.env);

app.use(express.static(path.join(__dirname, "public")));

// await connectDB().then(() => console.log("Database connected successfully"));
// connectDB();
let collection;
connectDB
  .connectDB()
  .then(async (db) => {
    console.log("Database connected");
    // Các lệnh tiếp theo của bạn
    collection = db.collection("admin");

    try {
      // const insertResult = await collection.insertMany([
      //   { a: 1 },
      //   { a: 2 },
      //   { a: 3 },
      //   { a: 4 },
      //   { a: 5 },
      // ]);
      // console.log("insert ok");
      // const deleteResult = await collection.deleteMany({ a: 1 });
      await collection.deleteMany({});
      // console.log("Inserted documents =>", insertResult);
    } catch (err) {
      console.error("Lỗi insert:", err.message);
    }
    const indexes = await collection.indexes();
    // console.log(indexes);
    // console.log(collection.collectionName);
    const docs = await collection.find().toArray();
    console.log(docs);
    const collections = await db.listCollections().toArray();
    console.log(collections.map((c) => c.name));
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
app.get("/api/user", async (req, res) => {
  const data = [];
  await axios
    .get("https://jsonplaceholder.typicode.com/users")
    .then((response) => {
      console.log(response.data);
      response.data.forEach((user) => {
        const objectData = {
          id: user.id,
          name: user.name,
          email: user.email,
        };
        data.push(objectData);
      });
    })
    .catch((error) => {
      console.error("This content does not exist. Please check again!");
    });
  res.json(data); // Trả về JSON
});

app.get("/api/user/:id", async (req, res) => {
  const params = req.params;
  const { id } = params;
  const data = [];
  if (id) {
    await axios
      .get("https://jsonplaceholder.typicode.com/users")
      .then((response) => {
        const findData = response.data.find((user) => user.id == id);
        console.log(findData);
        if (findData) {
          data.push(findData);
        }
      })
      .catch((error) => {
        console.error("This content does not exist. Please check again!");
      });
  }
  res.json(data); // Trả về JSON
});
app.get("/ejs", (req, res) => {
  res.render("example.ejs");
});

// Trang cần đăng nhập
app.get("/private", (req, res, next) => {
  const loggedIn = false;
  if (!loggedIn) {
    return next({ status: 401, message: "Bạn chưa đăng nhập" });
  }
  res.send("Đã vào trang riêng tư");
});

// Trang admin
app.get("/admin", (req, res, next) => {
  const isAdmin = false;
  if (!isAdmin) {
    return next({ status: 403, message: "Không đủ quyền truy cập" });
  }
  res.send("Trang admin");
});

// Lỗi giả lập
app.get("/error", (req, res) => {
  throw new Error("Lỗi 500 bất ngờ!");
});

// 404 – Không tìm thấy route nào khớp
app.use((req, res) => {
  res.status(404).send({ message: "404 - Không tìm thấy trang" });
});

// Xử lý lỗi tổng quát
app.use((err, req, res, next) => {
  console.error("Lỗi:", err.message);
  res.status(err.status || 500).send({
    error: true,
    message: err.message || "Lỗi máy chủ",
  });
});

app.listen(port, hostname, () => {
  console.log(`Example app listening on port ${port}`);
});
