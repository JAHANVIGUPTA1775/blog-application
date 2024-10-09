const Blog = require("../models/blogs.js");
const { Op } = require("sequelize");
const User = require("../models/users.js");

const getAllBlogs = async (req, res) => {
  if (!Blog) {
    return res.status(500).send("Blog model not initialized");
  }

  const q = req.query.q;
  if (q) {
    res.redirect(`/se1?q=${q}`);
  }
  const limit = 6;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  try {
    // const totalBlogsResult = await client.query("SELECT COUNT(*) FROM blogs");
    // const totalBlogs = parseInt(totalBlogsResult.rows[0].count, 10);
    // const blogsResult = await client.query(
    //   "SELECT * FROM blogs ORDER BY createdon DESC LIMIT $1 OFFSET $2",
    //   [limit, offset]
    // );
    // console.log(await blogModel.count());

    const totalBlogs = await Blog.count();
    const blogs = await Blog.findAll({
      limit: limit,
      offset: offset,
      order: [["createdon", "DESC"]],
    });
    const totalPages = Math.ceil(totalBlogs / limit);

    res.render("Blogcard", {
      blogs: blogs,
      currentPage: page,
      totalPages: totalPages,
      user: req.user,
      q: "",
    });
    // res.render("Blogcard", {
    //   blogs: blogsResult.rows,
    //   currentPage: page,
    //   totalPages: totalPages,
    //   user: req.user,
    //   q: "",
    // });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching blogs");
  }
};

const getBlogsByCategory = async (req, res) => {
  try {
    // const result = await client.query(
    //   `SELECT * FROM blogs WHERE category = $1`,
    //   [req.params.cat]
    // );
    const blogs = await Blog.findAll({
      where: {
        category: req.params.cat,
      },
    });
    res.render("Blogcategory", {
      blogs: blogs, // Use blogs directly
      category: req.params.cat,
    });
    // res.render("Blogcategory", {
    //   blogs: result.rows,
    //   category: req.params.cat,
    // });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching blogs");
  }
};

const getBlogData = async (req, res) => {
  try {
    const { default: dateFormat } = await import("dateformat");

    const blog = await Blog.findOne({
      where: { id: req.params.id },
    });
    // const result = await client.query(
    //   `SELECT * FROM blogs where id= ${req.params.id}`
    // );
    // const blog = result.rows[0];
    const authorId = blog.author_id;

    const username = await User.findOne({
      where: { id: authorId },
      attributes: ["name"],
    });
    // const usernameResult = await client.query(
    //   "SELECT name FROM users WHERE id = $1",
    //   [authorId]
    // );
    // const username = usernameResult.rows[0].name;

    blog.formatDate = dateFormat(
      blog.createdon,
      "dddd, mmmm dS, yyyy, h:MM TT"
    );
    blog.editDate = dateFormat(blog.edited_at, "mmmm dS, yyyy, h:MM TT");
    res.render("Blogdata", { blogs: blog, username: username.name });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching blog");
  }
};

viewOwnBlog = async (req, res) => {
  const q = req.query.q || "";

  try {
    // const result = await client.query(
    //   `SELECT * FROM blogs WHERE author_id = $1`,
    //   [req.user.id]
    // );
    let searchResult;
    let message = "";
    if (q) {
      searchResult = await Blog.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.iLike]: `%${q}%` } },
            { post: { [Op.iLike]: `%${q}%` } },
          ],
        },
      });
      // searchResult= await client.query("SELECT * FROM blogs WHERE title ILIKE $1 or post ILIKE $1", [`%${q}%`] );
      if (searchResult.rowCount === 0) {
        message = "No blogs found";
      }
    } else {
      searchResult = await Blog.findAll({
        where: {
          author_id: req.user.id,
        },
      });
      // searchResult = await client.query(
      //     `SELECT * FROM blogs WHERE author_id = $1`,
      //     [req.user.id]
      //   );
    }
    res.render("Viewmyblog", { blogs: searchResult, q: q });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching blogs");
  }
};

module.exports = {
  getAllBlogs,
  getBlogsByCategory,
  getBlogData,
  viewOwnBlog,
};
