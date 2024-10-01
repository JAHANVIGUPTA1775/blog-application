const express= require("express");
const router = express.Router();
const client = require("../db/conn.js");
const {checkNotAuthenticated}= require("../middlewares")
const {checkPermission}= require("../middlewares")

router.get("/",checkNotAuthenticated, checkPermission("Modify Categories"), async(req,res)=>{
    try {
      const categoryResult= await client.query("SELECT * FROM categories");
      res.render("CreateCategory", {categories:categoryResult.rows });
    } catch (error) {
      console.log(error);
      res.status(500).send("Error fetching categories");
    }
  })
  
router.post("/createcategory", async(req,res)=>{
  
    const categoryName= req.body;
    // console.log(categoryName); 
    try {
      await client.query('INSERT INTO categories (category_name) VALUES ($1)', [categoryName.categoryname]);
      res.redirect("/category");
    } catch (error) {
      console.log(error);
      res.status(500).send("Error creating category");
    }
  })

  module.exports=router;