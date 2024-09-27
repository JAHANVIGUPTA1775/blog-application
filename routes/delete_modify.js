
const express= require("express");
const router = express.Router();
const client = require("../db/conn.js");
const {checkPermission}= require("../middlewares")
const {checkNotAuthenticated}= require("../middlewares")

router.delete("/:id", async (req, res) => {
    const blogId = req.params.id;
  
    try {
      await client.query("DELETE FROM blogs WHERE id=$1", [blogId]);
      res.redirect("/blogs");
    } catch (error) {
      console.error("Error deleting blog:", error);
      res.status(500).send("Error deleting the blog");
    }
  });
  
  router.get(
    "/",
    checkNotAuthenticated,
    checkPermission("Delete All Blogs"),
    async (req, res) => {
      try {
        const blogresult = await client.query("SELECT * FROM blogs");
        const blogs = blogresult.rows;
        res.render("DeleteAnyBlog", { blogs });
      } catch (error) {
        console.log(error);
        res.status(500).send("error fetching blogs");
      }
    }
  );
module.exports=router;