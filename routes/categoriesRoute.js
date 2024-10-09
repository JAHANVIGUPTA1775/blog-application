const express = require("express");
const router = express.Router();
const { checkNotAuthenticated } = require("../middlewares");
const { checkPermission } = require("../middlewares");
const { getCategories, createCategories, deleteCategory } = require("../controllers/categoriesController")

router.get(
  "/",
  checkNotAuthenticated,
  checkPermission("Modify Categories"),
  getCategories
);

router.post("/createcategory", createCategories);

router.delete("/delete/:id", deleteCategory);

module.exports = router;
