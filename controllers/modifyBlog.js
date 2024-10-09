const Blog = require("../models/blogs.js");

getBlogs = async (req, res) => {
  const q = req.query.q;

  try {
    const blogs = await Blog.findAll();
    // const blogresult = await client.query("SELECT * FROM blogs");
    // const blogs = blogresult.rows;
    res.render("Modify", { blogs });
  } catch (error) {
    console.log(error);
    res.status(500).send("error fetching blogs");
  }
};

deleteBlogs = async (req, res) => {
  const blogId = req.params.id;

  try {
    await Blog.destroy({
      where: { id: blogId },
    });
    // await client.query("DELETE FROM blogs WHERE id=$1", [blogId]);
    res.redirect("/blogs");
    // return res.json({
    //   success:true,
    //   message: "Blog deleted successfully"
    // })
  } catch (error) {
    console.error("Error deleting blog:", error);
    // return res.json({
    //   success:false,
    //   message: "Error deleting the blog"
    // })
    res.status(500).send("Error deleting the blog");
  }
};

module.exports = { getBlogs, deleteBlogs };
