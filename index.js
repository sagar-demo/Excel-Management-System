// server.js

const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
const excelToJson = require("convert-excel-to-json");
const { MongoClient } = require("mongodb");
const xlsx = require("xlsx");
const ejs = require("ejs");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();

// Configure Multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configure Mongoose to connect to MongoDB
// Configure Mongoose to connect to MongoDB
mongoose.connect(
  "mongodb+srv://sagarrana:PRzDl4vLMDIpxU3i@cluster0.uec82ld.mongodb.net/csvuploader_db",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});

// Define a schema for the data
const dataSchema = new mongoose.Schema({});

// Define a model for the data
const Data = mongoose.model("Data", dataSchema);

// Configure EJS as the view engine
app.set("view engine", "ejs");

// Configure sessions
app.use(
  session({
    secret: "myappsecret",
    resave: false,
    saveUninitialized: true,
  })
);
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public/css")));
// Configure body parser to handle POST requests
app.use(bodyParser.urlencoded({ extended: true }));

// Define routes
app.get("/", (req, res) => {
  res.render("signup.ejs", { session: req.session });
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    // Read all sheets of the Excel file
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetNames = workbook.SheetNames;
    const sheets = sheetNames.map((name) =>
      xlsx.utils.sheet_to_json(workbook.Sheets[name])
    );

    // Extract all column names from all sheets
    const columnNames = new Set();
    for (const sheet of sheets) {
      for (const row of sheet) {
        for (const columnName of Object.keys(row)) {
          columnNames.add(columnName);
        }
      }
    }

    // Create a new collection with the file name as the collection name
    const collectionName = req.file.originalname.split(".")[0];
    const collection = await db.createCollection(collectionName);

    // Insert all rows into the collection
    for (const sheet of sheets) {
      for (const row of sheet) {
        await collection.insertOne(row);
      }
    }

    // Display a success message
    req.session.message = "File uploaded successfully";

    // Redirect to the dashboard
    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
    // Display an error message
    req.session.message = "Error uploading file";
    // Redirect to the homepage
    res.redirect("/");
  }
});
//getting the all data

app.get("/dashboard", async (req, res) => {
  try {
    // Get all collections in the database
    const collections = await db.db.listCollections().toArray();

    // Get the data from each collection and extract column names
    const data = [];
    let columnNames = [];
    for (const collection of collections) {
      const cursor = await db.db
        .collection(collection.name)
        .find({}, { projection: { _id: 0 } });
      const documents = await cursor.toArray();
      if (documents.length > 0) {
        const firstDoc = documents[0];
        columnNames = [...new Set([...columnNames, ...Object.keys(firstDoc)])];
        data.push(
          ...documents.filter((doc) =>
            Object.values(doc).some((value) => value !== null && value !== "")
          )
        );
      }
    }

    // Remove duplicates from column names array
    const uniqueColumnNames = [...new Set(columnNames)];

    // Render the dashboard with the data and column names
    res.render("dashboard", {
      data,
      columnNames: uniqueColumnNames,
      session: req.session,
    });
  } catch (error) {
    console.error(error);
    // Display an error message
    req.session.message = "Error retrieving data";
    // Redirect to the homepage
    res.redirect("/");
  }
});
//login & signup
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // TODO: Check if the email and password are valid

  // Redirect to the dashboard
  res.redirect("/dashboard");
});

app.post("/signup", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // TODO: Create a new user with the given email and password

  // Redirect to the dashboard
  res.redirect("/dashboard");
});

// Start the server
const port = process.env.PORT || 500;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
