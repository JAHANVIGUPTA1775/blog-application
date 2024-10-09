const express = require("express");
const router = express.Router();
const { checkPermission } = require("../middlewares/index.js");
const { checkNotAuthenticated } = require("../middlewares/index.js");
const { getBlogs, deleteBlogs } = require("../controllers/modifyBlog.js");

router.get(
  "/",
  checkNotAuthenticated,
  checkPermission("Modify Blogs"),
  getBlogs
);

router.delete("/:id", deleteBlogs);

module.exports = router;
