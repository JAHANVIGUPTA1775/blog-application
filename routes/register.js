const express=require("express")
const router= express.Router();
const client = require("../db/conn.js");
const {checkNotAuthenticated}= require("../middlewares");
const {checkPermission}= require("../middlewares")
const bcrypt= require("bcrypt");

router.get(
    "/",
    checkNotAuthenticated,
    checkPermission("Create User"),
    async (req, res) => {
      try {
        const roles = await client.query("SELECT * FROM roles");
        res.render("register", { roles: roles.rows });
      } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
      }
    
    }
  );
  
  
  
  router.post("/", async (req, res) => {
    let { name, email, password, password2, role } = req.body;
    // console.log(role);
    let errors = [];
  
    let nameRegex = /^[a-zA-Z ]{3,30}$/; // Allows only letters and spaces, length between 2 to 30 characters
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format validation
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // Password must be 6-20 characters, include at least one numeric digit, one uppercase, and one lowercase letter
  
    if (!name || !nameRegex.test(name)) {
      errors.push({ message: "Please enter valid username" });
    }
    if (!email || !emailRegex.test(email)) {
      errors.push({ message: "Please enter valid email" });
    }
    if (!password || !passwordRegex.test(password)) {
      errors.push({ message: "Please enter valid password" });
    }
    if (password !== password2) {
      errors.push({ message: "Password do not match" });
    }
    const roleResult = await client.query(`SELECT * FROM roles`);
    const roles = roleResult.rows;
    // console.log(roles);
    if (errors.length > 0) {
      // return res.render("register", { errors, roles });
      return res.json({
        success: false,
        message: "Validation Failed",
        errors,
        roles});
    }
  
    try {
      const emailResult = await client.query(
        `SELECT * FROM users WHERE email= $1`,
        [email]
      );
      if (emailResult.rows.length > 0) {
        errors.push({ message: "Email already exists" });
        // return res.render("Register", { errors, roles });
        return res.json({
          success:false,
          message: "Email already exists",
          errors,
          roles
        });
      }
  
      let hashedPass = await bcrypt.hash(password, 10);
      await client.query(
        "INSERT INTO users (name, email, password, role_id) VALUES ($1, $2, $3, $4)",
        [name, email, hashedPass, role]
      );
      // res.redirect("/blogs");
      return res.json({
        success:true,
        message:"User registered successfully",
        roles
      });
    } catch (error) {
      console.log(error);
      errors.push({ message: "Something went wrong, try again" });
      // res.render("Register", { errors, roles });
      return res.json({
        success:false,
        message:"Something went wrong, try again",
        errors,
        roles
      });
    }
  });

  module.exports=router;