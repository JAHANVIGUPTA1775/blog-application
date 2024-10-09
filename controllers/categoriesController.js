const client = require("../db/conn.js");
const Category = require("../models/categories.js");

const getCategories = async (req, res) => {
  try {
    const categoryResult = await Category.findAll();
    // const categoryResult = await client.query("SELECT * FROM categories");
    res.render("CreateCategory", { categories: categoryResult });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching categories");
  }
};

const createCategories = async (req, res) => {
  try {
    // await client.query("INSERT INTO categories (category_name) VALUES ($1)", [
    //   categoryName.categoryname,
    // ]);
   
    const categoryName= req.body.categoryname;
    // console.log(req.body);
    await Category.create({category_name: categoryName});
    res.redirect("/category");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error creating category");
  }
};

const deleteCategory = async (req, res) => {
  try {
    await Category.destroy({
      where: { id: req.params.id },
    });
    // res.redirect("/category/createcategory");
    return res.json({
      success: true,
      message: "Category deleted successsfully",
    });
  } catch (error) {
    console.log(error);
    // res.status(500).send("Error deleting category");
    return res.json({
      success: false,
      message: "Error deleting category",
    });
  }
};

module.exports = { getCategories, createCategories, deleteCategory };
