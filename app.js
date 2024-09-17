const express = require("express");
const app = express();
const port = 3000;
const client = require("./db/conn.js");
const multer = require("multer");
const cors = require("cors");
const bcrypt = require("bcrypt");
const passport = require("passport");
const initializePass = require("./passportConfig.js");
const session = require("express-session");
const flash = require("express-flash");
const path = require('path');
const methodOverride= require('method-override');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // Add a timestamp to avoid filename conflicts
  }
});
const upload = multer({ storage: storage });

app.use(express.json());
app.use(cors());
app.use(flash());

// app.use('/images', express.static(path.join(__dirname, 'uploads')));
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));

app.set("view engine", "ejs");
app.set("views",path.resolve("./views"));

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

app.get("/users/register", checkNotAuthenticated,checkRole('admin') ,(req, res) => {
  return res.render("register");
});

app.get("/users/login", checkAuthenticated, (req, res) => {
  return res.render("login");
});

app.post("/users/register", async (req, res) => {
  let { name, email, password, password2, role } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2 ) {
    errors.push({ message: "please enter all the fields" });
  }
  if (password.length < 6) {
    errors.push({ message: "password must be 6 characters long" });
  }
  if (password !== password2) {
    errors.push({ message: "passwords do not match" });
  }
  if (errors.length > 0) {
    res.render("register", { errors });
  } else {
    let hashedPass = await bcrypt.hash(password, 10);
    // console.log(hashedPass)

    await client.query(
      `SELECT * FROM users WHERE email= $1`,
      [email],
      (err, results) => {
        if (err) {
          throw err;
        }
        // console.log("reached")
        // console.log(results.rows);
        if (results.rows.length > 0) {
          errors.push({ message: "email already exists" });
          res.render("register", { errors });
        } else {
          client.query(
            `INSERT INTO users (name, email, password,role)
                      VALUES ($1, $2,$3, $4)`,
            [name, email, hashedPass, role],
            (err, result) => {
              if (err) {
                throw err;
              }
              // console.log(result.rows);
              req.flash("success_msg", "you are now registered. please login");
              res.redirect("/blogs");
            }
          );
        }
      }
    );
  }
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/blogs",
    failureRedirect: "/users/login",
    failureFlash: true,
  })
);

app.get("/users/logout", (req, res) => {
  req.logOut(() => {
    req.flash("success_msg", "you have successfully logged out");
    res.redirect("/users/login");
  });
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/blogs");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}

function checkRole(role){
  return (req,res,next)=>{
    if( req.user.role===role){
      return next();
    }
    res.status(403).send('Access Denied');
  }
}

app.get("/createblog", (req, res) => {
  res.render("CreateBlog"); // Render the create blog page template
});

app.get("/", (req, res) => {
  res.json({ msg: "hello world" });
});

app.get("/blogs", checkNotAuthenticated, async (req, res) => {
  // const blog = await client.query("SELECT * FROM blogs");
  // res.render("Blogcard", { blogs: blog.rows, user:req.user });
  const limit=3;
  const page= parseInt(req.query.page)||1;
  const offset=(page-1)*limit;

  try{
    const totalBlogsResult=await client.query("SELECT COUNT(*) FROM blogs");
    const totalBlogs = parseInt(totalBlogsResult.rows[0].count,10);
    const blogsResult= await client.query("SELECT * FROM blogs ORDER BY createdon DESC LIMIT $1 OFFSET $2", [limit,offset]);
    const totalPages= Math.ceil(totalBlogs/limit);
    // console.log(totalBlogs);
    

    res.render("Blogcard", {
      blogs: blogsResult.rows,
      currentPage: page,
      totalPages:totalPages,
      user:req.user
    });
  }
  catch(err){
    console.log(err);
    res.status(500).send("error fetching blogs");

  }
});


app.get("/blogs/:cat", async (req, res) => {
  try {
    const result = await client.query(
      `SELECT * FROM blogs WHERE category = $1`,[req.params.cat] 
    );
    res.render("Blogcategory", { blogs: result.rows, category: req.params.cat });
    // console.log(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching blogs");
  }
});


app.get("/viewmyblog", async(req,res)=>{
  try {
    const result = await client.query(
      `SELECT * FROM blogs WHERE author_id = $1`,[req.user.id] 
    );
    res.render("Viewmyblog", { blogs: result.rows});
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching blogs");
  }
})


app.get("/blogdata/:id", async (req, res) => {

  const { default: dateFormat } = await import('dateformat');
  const result = await client.query(
    `SELECT * FROM blogs where id= ${req.params.id}`
  );
  
  const blog = result.rows[0];
  blog.formatDate= dateFormat(blog.createdon, "dddd, mmmm dS, yyyy, h:MM TT");
  // console.log(blog);
  res.render("blogdata", { blogs: result.rows[0] });
 
});

app.delete('/blogdata/:id', checkNotAuthenticated, async(req,res)=>{
  const result=await client.query(`SELECT * FROM blogs where id=$1`, [req.params.id])
  const blog=result.rows[0];

  if(blog.author_id!==req.user.id){
    return res.status(403).send("you are not authorized")
    // return res.render('Blogcard', {blogs: blog, message:'You are not authenticated'})
    // req.flash('error','you are not authenticated');
  }
  await client.query(`DELETE FROM blogs where id=$1`, [req.params.id]);
  res.redirect('/blogs')
})

// app.get("/blogs/:id/edit", checkNotAuthenticated, async(req,res)=>{

//   const result=await client.query(`SELECT * FROM blogs WHERE id=$1`, [req.params.id]);
//   const blogs=result.rows[0];
//   console.log(blogs);


//   const blogData={

//   }
//   res.render("EditBlog.ejs", {blogs});
// })

app.post("/blogs", upload.single("image"), async (req, res) => {
  // console.log(req.body);
  // console.log(req.file);
  const blogData = {
    title: req.body.title,
    category: req.body.category,
    image: req.file ? `/uploads/${req.file.filename}` : null, // Use the randomly generated filename
    post: req.body.post,
    author_id: req.user.id,
  };
  // console.log(blogData);
  try {
    await client.query(
      `INSERT INTO blogs (title, image,post, category, author_id) VALUES ($1, $2, $3,$4, $5)`,
      [blogData.title, blogData.image, blogData.post, blogData.category, blogData.author_id]
    );
    res.redirect('/blogs');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving blog");
  }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
