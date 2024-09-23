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
const path = require("path");
const methodOverride = require("method-override");
const { permission } = require("process");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // Add a timestamp to avoid filename conflicts
  },
});
const upload = multer({ storage: storage });

app.use(express.json());
app.use(cors());
app.use(flash());

// app.use('/images', express.static(path.join(__dirname, 'uploads')));
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static("public"));

app.set("view engine", "ejs");
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
  // res.locals.success_msg = req.flash('success_msg');
  res.locals.user = req.user; // 'req.user' contains the authenticated user if logged in
  next();
});

app.get(
  "/users/register",
  checkNotAuthenticated,
  checkRole("Admin"),
  async (req, res) => {
    try {
      const roles = await client.query("SELECT * FROM roles");
      // console.log(roles.rows)
      res.render("register", { roles: roles.rows });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal server error");
    }
    // return res.render("register");
  }
);

app.get("/users/login", checkAuthenticated, (req, res) => {
  return res.render("login");
});

app.post("/users/register", async (req, res) => {
  let { name, email, password, password2, role } = req.body;
  let errors = [];
  // console.log(role);
  const roleResult = await client.query(`SELECT * FROM roles WHERE id = $1`, [
    role,
  ]);
  const roleData = roleResult.rows[0];
  // console.log(roleResult);

  if (!name || !email || !password || !password2) {
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
            `INSERT INTO users (name, email, password, role_id, role)
                      VALUES ($1, $2,$3, $4, $5)`,
            [name, email, hashedPass, roleData.id, roleData.role_name],
            (err, result) => {
              if (err) {
                throw err;
              }
              // console.log(result.rows);
              // req.flash("success_msg", "User Registered");
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
  // (req,res)=>{
  //   req.flash('success_msg', 'Succefully Logged In');
  //   res.redirect('/blogs')
  // }
);

// app.post("/users/login", async(req,res,next)=>{
//   const {email,password}=req.body;
//   let errors=[];
//   const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//   const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

//   if(!emailPattern.test(email)){
//     errors.push({message:"Invalid email format"});
//   }
//   if (!passwordPattern.test(password)) {
//     errors.push({ message: "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character" });
//   }

//   if(errors.length>0){
//     return res.render("login", {errors});
//   }
//   else{
//     passport.authenticate("local", {
//       successRedirect: "/blogs",
//       failureRedirect: "/users/login",
//       failureFlash: true,
//     })
//   }
// })

app.get("/users/logout", (req, res) => {
  req.logOut(() => {
    req.flash("success_msg", "you have successfully logged out");
    res.redirect("/blogs");
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

function checkRole(role) {
  return async (req, res, next) => {

    const roleIdResult= await client.query("SELECT role_id from users where id=$1", [req.user.id]);
    const roleId= roleIdResult.rows[0].role_id;

    const roleNameResult = await client.query(
        "SELECT role_name FROM roles WHERE id= $1",
        [roleId]
      );
    const roleName = roleNameResult.rows[0].role_name;

    if (roleName === role) {
      return next();
    }
    res.status(403).send("Access Denied");
  };
}

app.get("/createblog", checkNotAuthenticated, (req, res) => {
  res.render("CreateBlog"); // Render the create blog page template
});

app.get("/", async (req, res) => {
  // res.json({ msg: "hello world" });
  const limit = 9;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  try {
    const totalBlogsResult = await client.query("SELECT COUNT(*) FROM blogs");
    const totalBlogs = parseInt(totalBlogsResult.rows[0].count, 10);
    const blogsResult = await client.query(
      "SELECT * FROM blogs ORDER BY createdon DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    const totalPages = Math.ceil(totalBlogs / limit);
    // console.log(totalBlogs);

    res.render("Home", {
      blogs: blogsResult.rows,
      currentPage: page,
      totalPages: totalPages,
      user: req.user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("error fetching blogs");
  }
});

app.get("/blogs", async (req, res) => {

  const q=req.query.q;
  if(q){
    res.redirect(`/se1?q=${q}`);
  }
  const limit = 6;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  try {
    const totalBlogsResult = await client.query("SELECT COUNT(*) FROM blogs");
    const totalBlogs = parseInt(totalBlogsResult.rows[0].count, 10);
    const blogsResult = await client.query(
      "SELECT * FROM blogs ORDER BY createdon DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    const totalPages = Math.ceil(totalBlogs / limit);
    // console.log(totalBlogs);

    res.render("Blogcard", {
      blogs: blogsResult.rows,
      currentPage: page,
      totalPages: totalPages,
      user: req.user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("error fetching blogs");
  }
});

app.get("/blogs/:cat", async (req, res) => {
  try {
    const result = await client.query(
      `SELECT * FROM blogs WHERE category = $1`,
      [req.params.cat]
    );
    res.render("Blogcategory", {
      blogs: result.rows,
      category: req.params.cat,
    });
    // console.log(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching blogs");
  }
});

app.get("/viewmyblog", async (req, res) => {
  try {
    const result = await client.query(
      `SELECT * FROM blogs WHERE author_id = $1`,
      [req.user.id]
    );
    res.render("Viewmyblog", { blogs: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching blogs");
  }
});

app.get("/blogdata/:id", async (req, res) => {
  const { default: dateFormat } = await import("dateformat");
  const result = await client.query(
    `SELECT * FROM blogs where id= ${req.params.id}`
  );

  const blog = result.rows[0];
  blog.formatDate = dateFormat(blog.createdon, "dddd, mmmm dS, yyyy, h:MM TT");
  // console.log(blog);
  res.render("blogdata", { blogs: result.rows[0] });
});

app.delete("/blogdata/:id", checkNotAuthenticated, async (req, res) => {
  const result = await client.query(`SELECT * FROM blogs where id=$1`, [
    req.params.id,
  ]);
  // console.log(result);
  const blog = result.rows[0];

  if (blog.author_id !== req.user.id) {
    return res.status(403).send("you are not authorized");
  }
  await client.query(`DELETE FROM blogs where id=$1`, [req.params.id]);
  res.redirect("/blogs");
});

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
  const user = req.user;
  try {
    const newblog = await client.query(
      `INSERT INTO blogs (title, image,post, category, author_id) VALUES ($1, $2, $3,$4,$5) RETURNING id`,
      [
        blogData.title,
        blogData.image,
        blogData.post,
        blogData.category,
        blogData.author_id,
      ]
    );
    // console.log(newblog.rows);
    await client.query(
      `INSERT INTO user_has_blogs (user_id, blog_id) VALUES ($1, $2)`,
      [user.id, newblog.rows[0].id]
    );
    // console.log("user", user);
    res.redirect("/blogs");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving blog");
  }
});

app.get("/se1", async(req,res)=>{
  const q= req.query.q;
  // const {q} =req.body;
  try {
    // console.log(q)
    const results= await client.query('SELECT * FROM blogs WHERE title ILIKE $1 OR post ILIKE $1', [`%${q}%`]);
    // console.log(results.rows);
    res.render('Blogcard', {blogs: results.rows,currentPage:1,totalPages:1});

  } catch (error) {
    console.error(error);
    res.status(500).send("Error searching blog");
  }
})

app.get(
  "/seeUsers",
  checkNotAuthenticated,
  checkRole("Admin"),
  async (req, res) => {
    try {
      const users = await client.query("SELECT * FROM users");
      const roles = await client.query("SELECT * FROM roles");
      const permissions = await client.query("SELECT * FROM permissions");
      const rolePermissions = await client.query(
        "SELECT * FROM rolehaspermission"
      );

      const rolePermissionMap = {};
      rolePermissions.rows.forEach((rp) => {
        if (!rolePermissionMap[rp.role_id]) {
          rolePermissionMap[rp.role_id] = [];
        }
        rolePermissionMap[rp.role_id].push(rp.permission_id);
      });

      res.render("Users", {
        users: users.rows,
        roles: roles.rows,
        permissions: permissions.rows,
        rolePermissionMap,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("error fetching data");
    }
  }
);

app.post("/permissions/edit-user-role", async (req, res) => {
  const { userid, roleid } = req.body;
  // console.log(req.body);

  try {
    await client.query("UPDATE users SET role_id=$1 WHERE id=$2", [
      roleid,
      userid,
    ]);
    res.redirect("/permissions");
  } catch (error) {
    console.log(error);
    res.status(500).send("error updating user role");
  }
});

app.get(
  "/admin",
  checkNotAuthenticated,
  checkRole("Admin"),
  async (req, res) => {
    res.render("Adminpage");
  }
);

app.get(
  "/changeRolePerm",
  checkNotAuthenticated,
  checkRole("Admin"),
  async (req, res) => {
    res.render("Changepermissions");
  }
);

app.get(
  "/createrole",
  checkNotAuthenticated,
  checkRole("Admin"),
  async (req, res) => {
    const permission = await client.query("SELECT * FROM permissions");

    // console.log(permission);
    res.render("Createrole", {
      permissions: permission.rows,
    });
  }
);

app.post("/createrole", async (req, res) => {
  const { rolename } = req.body;
  const permissions = req.body["permissions[]"] || [];
  // console.log(req.body);
  // console.log(rolename);
  // console.log(permissions);

  try {
    const existinguser = await client.query(
      "SELECT * FROM roles where role_name =$1",
      [rolename]
    );

    if (existinguser.rows.length > 0) {
      res.status(400).send("role name already exists");
    }
    const result = await client.query(
      "INSERT INTO roles (role_name) VALUES ($1) RETURNING id",
      [rolename]
    );
    const roleid = result.rows[0].id;

    if (permissions.length > 0) {
      permissions.forEach(async (permissionid) => {
        await client.query(
          "INSERT INTO rolehaspermission (role_id, permission_id) VALUES ($1, $2)",
          [roleid, permissionid]
        );
      });
    }
    res.send("Role created successfully");
    res.redirect("/blogs");
  } catch (error) {
    console.log(error);
    res.status(500).send("error catching role");
  }
});

app.get("/profile", checkNotAuthenticated, async (req, res) => {
  // const currentUser=req.user;
  // console.log(currentUser);

  const roleId = req.user.role_id;

  const roleNameResult = await client.query(
    "SELECT role_name FROM roles WHERE id= $1",
    [roleId]
  );
  const roleName = roleNameResult.rows[0].role_name;

  const permissionIdResult = await client.query(
    "SELECT * FROM rolehaspermission WHERE role_id =$1",
    [roleId]
  );

  const permissionsIds = permissionIdResult.rows.map(
    (row) => row.permission_id
  );

  if (permissionsIds.length > 0) {
    const permissionIdsString = permissionsIds.join(",");
    // console.log(permissionIdsString);
    const permissionNameResult = await client.query(
      `SELECT per_name FROM permissions WHERE id IN (${permissionIdsString}) `
    );
    // console.log(permissionNameResult);

    const permissionNames = permissionNameResult.rows.map(
      (row) => row.per_name
    );
    // console.log(permissionId.rows);
    // console.log(permissionNames);
    res.render("Profile", { permissionNames, roleName });
  } else {
    res.render("Profile", { permissionNames: [] });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
