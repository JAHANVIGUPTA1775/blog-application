
const express= require("express");
const router = express.Router();
const client = require("../db/conn.js");
const {checkPermission}= require("../middlewares/index.js")
const {checkNotAuthenticated}= require("../middlewares/index.js")

router.delete("/:id", async (req, res) => {
    const blogId = req.params.id;
  
    try {
      await client.query("DELETE FROM blogs WHERE id=$1", [blogId]);
      res.redirect("/blogs");
      // return res.json({
      //   success:true,
      //   message: "Blog deleted successfully"
      // })
    } catch (error) {
      console.error("Error deleting blog:", error);
      // return res.json({
      //   success:false,
      //   message: "Error deleting the blog"
      // })
      res.status(500).send("Error deleting the blog");
    }
  });
  
  router.get(
    "/",
    checkNotAuthenticated,
    checkPermission("Modify Blogs"),
    async (req, res) => {
      try {
        const blogresult = await client.query("SELECT * FROM blogs");
        const blogs = blogresult.rows;
        res.render("Modify", { blogs });
      } catch (error) {
        console.log(error);
        res.status(500).send("error fetching blogs");
      }
    }
  );
module.exports=router;