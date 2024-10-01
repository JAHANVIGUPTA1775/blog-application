const express= require("express");
const router = express.Router();
const {checkNotAuthenticated}= require("../middlewares")
const {checkPermission}= require("../middlewares")

router.get(
    "/",
    checkNotAuthenticated,
    checkPermission("Admin Panel"),
    async (req, res) => {
     
      res.render("Adminpage");
    }
  );

module.exports=router