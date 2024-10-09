const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const bcrypt = require("bcrypt");
const passport = require("passport");
const initializePass = require("./passportConfig.js");
const session = require("express-session");
const flash = require("express-flash");
const path = require("path");
const methodOverride = require("method-override");
const { connection } = require("./db/sequalize");
const client = require("./db/conn.js");
const Category= require("./models/categories.js")

const blogsRouter = require("./routes/blogsRoute.js");
const profileRouter = require("./routes/profile.js");
const rolesRouter = require("./routes/rolesRoute.js");
const adminRouter = require("./routes/admin");
const usersRouter = require("./routes/usersRoute.js");
const categoryRouter = require("./routes/categoriesRoute.js");
const homeRouter = require("./routes/home.js");
const modifyRouter = require("./routes/modifyBlog.js");


app.use(express.json());
app.use(cors());
app.use(flash());

app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, 'public')));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

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

app.use(async (req, res, next) => {
  try {
    const categoryResult= await Category.findAll();
    res.locals.categories = categoryResult;
    // const categoryResult = await client.query("SELECT * FROM categories");
    // res.locals.categories = categoryResult.rows;
    next();
  } catch (error) {
    console.log("Error fetching categories", error);
    res.locals.categories = [];
    next();
  }
});


app.use("/", homeRouter);

app.use("/", blogsRouter);

app.use("/", usersRouter);

app.use("/", rolesRouter);

app.use("/category", categoryRouter);

app.use("/modify", modifyRouter);

app.use("/admin", adminRouter);

app.use("/profile", profileRouter);


async function fun() {
  await connection();
}
fun();


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
