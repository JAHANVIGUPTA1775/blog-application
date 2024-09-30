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

      const q=req.query.q||"";

      try {
        // const result = await client.query(
        //   `SELECT * FROM blogs WHERE author_id = $1`,
        //   [req.user.id]
        // );
        let searchResult;
        let message="";
        if(q){
          searchResult= await client.query("SELECT * FROM blogs WHERE title ILIKE $1 or post ILIKE $1", [`%${q}%`] );
          if(searchResult.rowCount===0){
           message= "No blogs found"
          }
        }
        else{
          searchResult = await client.query(
              `SELECT * FROM blogs WHERE author_id = $1`,
              [req.user.id]
            );
        }
        res.render("Viewmyblog", { blogs: searchResult.rows, q:q });
      } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching blogs");
      }
    }
  );

  module.exports = router;
  