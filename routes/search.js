const express= require("express");
const router= express.Router();
const client= require("../db/conn.js")

router.get("/", async (req, res) => {
    const q = req.query.q||"";
  
    try {
      let results;
      let message = "";
      if (q) {
        results = await client.query(
          "SELECT * FROM blogs WHERE title ILIKE $1 OR post ILIKE $1",
          [`%${q}%`]
        );
        // console.log(results.rows);
        if (results.rowCount === 0) {
          message = "No blogs found matching your search";
        }
      } else {
        results = await client.query("SELECT * FROM blogs");
      }
      // console.log(message);
      res.render("Blogcard", {
        blogs: results.rows,
        currentPage: 1,
        totalPages: 1,
        q: q || "",
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error searching blog");
    }
  });
  
  module.exports=router;