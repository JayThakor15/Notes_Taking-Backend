const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());

dotenv.config();

mongoose
  .connect(process.env.MONGO_URL || "")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err: unknown) => {
    console.error("Error connecting to MongoDB:", err);
  });

app.get(
  "/",
  (req: import("express").Request, res: import("express").Response) => {
    res.send("Hello World!");
  }
);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
