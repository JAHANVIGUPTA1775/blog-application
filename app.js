const express = require("express");
const app = express();
const port = process.env.PORT|| 3000;
const client = require("./db/conn.js");
const multer = require("multer");
const cors = require("cors");
const bcrypt = require("bcrypt");
const passport = require("passport");
const initializePass = require("./passportConfig.js");
const session = require("express-session");
const flash = require("express-flash");
const path = require("path");
const methodOverride = require("method-override");

const { connection }= require("./db/sequalize")

const blogsRouter=require("./routes/blogs")
const blogdataRouter= require("./routes/blogdata")
const profileRouter= require("./routes/profile.js");
const createroleRouter= require("./routes/createrole.js")
const adminRouter= require("./routes/admin");
const loginRouter= require("./routes/login.js")
const viewblogRouter= require("./routes/viewmyblog.js")
const registerRouter= require("./routes/register.js")
const createblogRouter= require("./routes/createblog.js")
const homeRouter = require("./routes/home.js")
const editRouter= require("./routes/edit.js")
const seeusersRouter= require("./routes/users.js")
const logoutRouter= require("./routes/logout.js")
const modifyRouter= require("./routes/modify.js")
const searchRouter= require("./routes/search.js")
const categoryRouter= require("./routes/category.js")

app.use(express.json());
app.use(cors());
app.use(flash());

app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

app.set("views", path.resolve("./views"));

initializePass(passport);
app.use(
  session({
    secret: "secret",
    resave: false, // Don't save the session if it wasn't modified
    saveUninitialized: false, // Don't save new sessions that haven't been modified
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.user = req.user; // 'req.user' contains the authenticated user if logged in
  next();
});

app.use(async (req,res, next)=>{
  try {
    const categoryResult= await client.query("SELECT * FROM categories");
    res.locals.categories= categoryResult.rows;
    next();
  } catch (error) {
    console.log("Error fetching categories",error);
    res.locals.categories=[];
    next();
  }
})

app.use("/users/register", registerRouter);

app.use("/users/login", loginRouter);

app.use("/users/logout", logoutRouter);

app.use("/createblog", createblogRouter); 

app.use("/", homeRouter);

app.use("/blogs", blogsRouter);

app.use("/viewmyblog", viewblogRouter);

app.use("/blogdata", blogdataRouter);

app.use("/modify", modifyRouter);

app.use("/se1", searchRouter);

app.use("/seeUsers", seeusersRouter);

app.use("/blogs/edit", editRouter);

app.use("/admin", adminRouter);

// app.get(
//   "/changeRolePerm",
//   checkNotAuthenticated,
//   checkPermission("See All Users"),
//   async (req, res) => {
//     res.render("Changepermissions");
//   }
// );

app.use("/createrole", createroleRouter);

app.use("/profile", profileRouter);

app.use("/category", categoryRouter);

app.get("/category", async(req,res)=>{
  try {
    const categoryResult= await client.query("SELECT * FROM categories");

    console.log(categoryResult.rows);
    // res.render("CreateCategory");
    res.render("CreateCategory", {categories:categoryResult.rows });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching categories");
  }
})

app.post("/category/createcategory", async(req,res)=>{

  const categoryName= req.body;
  // console.log(categoryName); 
  try {
    await client.query('INSERT INTO categories (category_name) VALUES ($1)', [categoryName.categoryname]);
    res.redirect("/category");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error creating category");
  }
})

app.listen(port, () => {
  // console.log("starting database connection");
  console.log(`Example app listening on port ${port}`);
});
