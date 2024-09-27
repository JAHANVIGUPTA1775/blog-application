const express= require("express");
const router = express.Router();
const {checkPermission}= require("../middlewares")
const {checkNotAuthenticated}= require("../middlewares")

router.get(
    "/",
    checkNotAuthenticated,
    checkPermission("Create Blogs"),
    (req, res) => {
      res.render("CreateBlog");
    }
  );

  module.exports=router;