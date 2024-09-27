const express= require("express");
const router = express.Router();
const client = require("../db/conn.js");

router.get("/", async (req, res) => {
    // res.json({ msg: "hello world" });
    const limit = 9;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
  
    try {
      const totalBlogsResult = await client.query("SELECT COUNT(*) FROM blogs");
      const totalBlogs = parseInt(totalBlogsResult.rows[0].count, 10);
      const blogsResult = await client.query(
        "SELECT * FROM blogs ORDER BY createdon DESC LIMIT $1 OFFSET $2",
        [limit, offset]
      );
      const totalPages = Math.ceil(totalBlogs / limit);
      // console.log(totalBlogs);
  
      res.render("Home", {
        blogs: blogsResult.rows,
        currentPage: page,
        totalPages: totalPages,
        user: req.user,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("error fetching blogs");
    }
  });

  module.exports=router;