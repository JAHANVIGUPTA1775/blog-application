const express=require("express");
const router= express.Router();
const {checkNotAuthenticated}= require("../middlewares");
const {checkPermission}= require("../middlewares")
const client= require("../db/conn.js")

router.get(
    "/",
    checkPermission("View Own Blogs"),
    checkNotAuthenticated,
    async (req, res) => {
      try {
        const result = await client.query(
          `SELECT * FROM blogs WHERE author_id = $1`,
          [req.user.id]
        );
        res.render("Viewmyblog", { blogs: result.rows });
      } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching blogs");
      }
    }
  );

  module.exports = router;
  