const express= require("express");
const router = express.Router();
const client = require("../db/conn.js");
const upload = require("../multerConfig.js")

router.get("/", async (req, res) => {
    const q = req.query.q;
    if (q) {
      res.redirect(`/se1?q=${q}`);
    }
    const limit = 6;
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
      
      res.render("Blogcard", {
        blogs: blogsResult.rows,
        currentPage: page,
        totalPages: totalPages,
        user: req.user,
        q: ""
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("error fetching blogs");
    }
  });

  router.post("/", upload.single("image"), async (req, res) => {
    if(!req.user){
      return res.redirect("/users/login");
    }
    const blogData = {
      title: req.body.title,
      category: req.body.category,
      image: req.file ? `/uploads/${req.file.filename}` : null, // Use the randomly generated filename
      post: req.body.post,
      author_id: req.user.id,
    };
    const user = req.user;
    try {
      const newblog = await client.query(
        `INSERT INTO blogs (title, image,post, category, author_id) VALUES ($1, $2, $3,$4,$5) RETURNING id`,
        [
          blogData.title,
          blogData.image,
          blogData.post,
          blogData.category,
          blogData.author_id,
        ]
      );
      // console.log(newblog.rows);
      await client.query(
        `INSERT INTO user_has_blogs (user_id, blog_id) VALUES ($1, $2)`,
        [user.id, newblog.rows[0].id]
      );
      // console.log("user", user);
      return res.json({
        success: true,
        message: "Blog added successsfully"
      })
      // res.redirect("/blogs");
    } catch (err) {
      console.error(err);
      return res.json({
        success: false,
        message: "Error saving blog"
      })
      // res.status(500).send("Error saving blog");
    }
  });

  router.get("/:cat", async (req, res) => {
    try {
      const result = await client.query(
        `SELECT * FROM blogs WHERE category = $1`,
        [req.params.cat]
      );
      res.render("Blogcategory", {
        blogs: result.rows,
        category: req.params.cat,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error fetching blogs");
    }
  });

module.exports = router;