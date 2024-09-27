const express= require("express");
const router = express.Router();
const client = require("../db/conn.js");
const {checkPermission}= require("../middlewares")
const {checkNotAuthenticated}= require("../middlewares")
const upload = require("../multerConfig.js")

router.get(
    "/:id",
    checkNotAuthenticated,
    checkPermission("Edit Blogs"),
    async (req, res) => {
      try {
        const blog = await client.query("SELECT * FROM blogs WHERE id= $1", [
          req.params.id,
        ]);
        res.render("EditBlog", { blogs: blog.rows[0] });
      } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching data");
      }
    }
  );

  router.put("/:id", upload.single("image"), async (req, res) => {

    const { title, category, post } = req.body;
  
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const blogId = req.params.id;
  
    const editDate= new Date();
  
  
    try {
      if (image) {
        await client.query(
          "UPDATE blogs SET title = $1, category= $2, post = $3, image = $4, edited_at = $5 WHERE id = $6",
          [title, category, post, image, editDate, blogId]
        );
      } else {
        await client.query(
          "UPDATE blogs SET title = $1, category= $2, post = $3, edited_at= $4 WHERE id = $5",
          [title, category, post, editDate, blogId]
        );
      }
      // req.flash('success', 'Blog updated successfully!');
      res.redirect("/blogs");
    } catch (error) {
      console.log(error);
      res.status(500).send("Error updating blog");
    }
  });
  
  module.exports= router;