const express = require("express");
const router = express.Router();
const client = require("../db/conn.js");

router.get("/", async (req, res) => {
  res.redirect("/blogs");
});

module.exports = router;
