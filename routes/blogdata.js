const express= require("express");
const router = express.Router();
const client = require("../db/conn.js");
const {checkNotAuthenticated}= require("../middlewares")

router.get("/:id", async (req, res) => {
    const { default: dateFormat } = await import("dateformat");
    const result = await client.query(
      `SELECT * FROM blogs where id= ${req.params.id}`
    );
    const blog = result.rows[0];
    const authorId= blog.author_id;
    const usernameResult=await client.query('SELECT name FROM users WHERE id = $1', [authorId]);
    const username=usernameResult.rows[0].name;
    // console.log(username.rows[0].name);
    
    blog.formatDate = dateFormat(blog.createdon, "dddd, mmmm dS, yyyy, h:MM TT");
    blog.editDate = dateFormat(blog.edited_at, "mmmm dS, yyyy, h:MM TT");
    res.render("blogdata", { blogs: result.rows[0] , username});
  });
  
  router.delete("/:id", checkNotAuthenticated, async (req, res) => {
    const result = await client.query(`SELECT * FROM blogs where id=$1`, [
      req.params.id,
    ]);
    const blog = result.rows[0];
  
    if (blog.author_id !== req.user.id) {
      return res.status(403).send("you are not authorized");
    }
    await client.query(`DELETE FROM blogs where id=$1`, [req.params.id]);
    res.redirect("/blogs");
  });

  module.exports= router;
  