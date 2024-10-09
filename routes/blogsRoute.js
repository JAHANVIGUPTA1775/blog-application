const express = require("express");
const router = express.Router();
const upload = require("../multerConfig.js");
const {
  createBlog,
  deleteBlog,
  getEditBlogPage,
  updateBlog,
  search,
} = require("../controllers/blogsController.js");
const {
    getAllBlogs,
    getBlogsByCategory,
    getBlogData,
    viewOwnBlog,
  } = require("../controllers/getBlogsControllers.js");


const { checkNotAuthenticated } = require("../middlewares");
const { checkPermission } = require("../middlewares");

router.get("/blogs", getAllBlogs);

router.post("/blogs", upload.single("image"), createBlog);

router.get("/blogs/:cat", getBlogsByCategory);

router.get("/blogdata/:id", getBlogData);

router.delete("/blogdata/:id", checkNotAuthenticated, deleteBlog);

router.get(
  "/blogs/edit/:id",
  checkNotAuthenticated,
  checkPermission("Edit Blogs"),
  getEditBlogPage
);

router.put("/blogs/edit/:id", upload.single("image"), updateBlog);

router.get(
  "/createblog",
  checkNotAuthenticated,
  checkPermission("Create Blogs"),
  (req, res) => {
    res.render("CreateBlog");
  }
);

router.get("/se1", search);

router.get(
  "/viewmyblog",
  checkPermission("View Own Blogs"),
  checkNotAuthenticated,
  viewOwnBlog
);

module.exports = router;
