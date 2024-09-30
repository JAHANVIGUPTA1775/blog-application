const express=require("express");
const router= express.Router();
const {checkAuthenticated}= require("../middlewares");
const passport=require("passport")

router.get("/", checkAuthenticated, (req, res) => {
    return res.render("Login");
  });
  
router.post(
    "/",
    passport.authenticate("local", {
      successRedirect: `/blogs`,
      failureRedirect: "/users/login",
      failureFlash: true,
    })
  );

  module.exports=router;