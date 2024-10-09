const Blog = require("../models/blogs.js");
const { Op } = require("sequelize");
const client = require("../db/conn.js");

const createBlog = async (req, res) => {
  // console.log("File upload middleware hit");
  if (!req.user) {
    return res.redirect("/users/login");
  }
  console.log("this is author id", req.user.id);
  const blogData = {
    title: req.body.title,
    category: req.body.category,
    // image: req.file ? `/uploads/${req.file.filename}` : null, // Use the randomly generated filename
    image: req.file ? req.file.path : null,
    post: req.body.post,
    author_id: req.user.id,
  };

  try {
    await Blog.create(blogData);
    // const newblog = await client.query(
    //   `INSERT INTO blogs (title, image,post, category, author_id) VALUES ($1, $2, $3,$4,$5) RETURNING id`,
    //   [
    //     blogData.title,
    //     blogData.image,
    //     blogData.post,
    //     blogData.category,
    //     blogData.author_id,
    //   ]
    // );

    return res.json({
      success: true,
      message: "Blog added successsfully",
    });
  } catch (err) {
    console.error(err);
    return res.json({
      success: false,
      message: "Error saving blog",
    });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ where: { id: req.params.id } });
    if (blog.author_id !== req.user.id) {
      return res.status(403).send("you are not authorized");
    }
    await blog.destroy();
    // const result = await client.query(`SELECT * FROM blogs where id=$1`, [
    //   req.params.id,
    // ]);
    // const blog = result.rows[0];
    // await client.query(`DELETE FROM blogs where id=$1`, [req.params.id]);
    res.redirect("/blogs");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error deleting blog");
  }
};

const getEditBlogPage = async (req, res) => {
  try {
    const blog = await Blog.findOne({ where: { id: req.params.id } });
    res.render("EditBlog", { blogs: blog });
    // const blog = await client.query("SELECT * FROM blogs WHERE id= $1", [
    //   req.params.id,
    // ]);
    // res.render("EditBlog", { blogs: blog.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching data");
  }
};

const updateBlog = async (req, res) => {
  const { title, category, post } = req.body;

  const image = req.file ? `/uploads/${req.file.filename}` : null;
  const blogId = req.params.id;

  const editDate = new Date();

  try {
    if (image) {
      await Blog.update(
        {
          title: title,
          category: category,
          post: post,
          image: image,
          edited_at: editDate,
        },
        { where: { id: blogId } }
      );
      
      // await client.query(
      //   "UPDATE blogs SET title = $1, category= $2, post = $3, image = $4, edited_at = $5 WHERE id = $6",
      //   [title, category, post, image, editDate, blogId]
      // );
    } else {
      await Blog.update(
        { title: title, category: category, post: post, edited_at: editDate },
        { where: { id: blogId } }
      );
    }
    res.redirect("/blogs");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error updating blog");
  }
};

const search = async (req, res) => {
  const q = req.query.q || "";

  try {
    let results;
    let message = "";
    if (q) {
      results = await Blog.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.iLike]: `%${q}%` } }, // Case-insensitive title match
            { post: { [Op.iLike]: `%${q}%` } }, // Case-insensitive post match
          ],
        },
      });
      // results = await client.query(
      //   "SELECT * FROM blogs WHERE title ILIKE $1 OR post ILIKE $1",
      //   [`%${q}%`]
      // );
      // console.log(results.rows);
      if (results.rowCount === 0) {
        message = "No blogs found matching your search";
      }
    } else {
      results = await Blog.findAll();
      //results = await client.query("SELECT * FROM blogs");
    }
    res.render("Blogcard", {
      blogs: results || [],
      currentPage: 1,
      totalPages: 1,
      q: q || "",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error searching blog");
  }
};

module.exports = {
  createBlog,
  deleteBlog,
  getEditBlogPage,
  updateBlog,
  search,
};
