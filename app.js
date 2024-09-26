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
  res.locals.user = req.user; // 'req.user' contains the authenticated user if logged in
  next();
});

app.get(
  "/users/register",
  checkNotAuthenticated,
  checkPermission("Create User"),
  async (req, res) => {
    try {
      const roles = await client.query("SELECT * FROM roles");
      res.render("register", { roles: roles.rows });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal server error");
    }
  
  }
);

app.get("/users/login", checkAuthenticated, (req, res) => {
  return res.render("login");
});

app.post("/users/register", async (req, res) => {
  let { name, email, password, password2, role } = req.body;
  // console.log(role);
  let errors = [];

  let nameRegex = /^[a-zA-Z ]{3,30}$/; // Allows only letters and spaces, length between 2 to 30 characters
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format validation
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // Password must be 6-20 characters, include at least one numeric digit, one uppercase, and one lowercase letter

  if (!name || !nameRegex.test(name)) {
    errors.push({ message: "Please enter valid username" });
  }
  if (!email || !emailRegex.test(email)) {
    errors.push({ message: "Please enter valid email" });
  }
  if (!password || !passwordRegex.test(password)) {
    errors.push({ message: "Please enter valid password" });
  }
  if (password !== password2) {
    errors.push({ message: "Password do not match" });
  }
  const roleResult = await client.query(`SELECT * FROM roles`);
  const roles = roleResult.rows;
  // console.log(roles);
  if (errors.length > 0) {
    res.render("register", { errors, roles });
  }

  try {
    const emailResult = await client.query(
      `SELECT * FROM users WHERE email= $1`,
      [email]
    );
    if (emailResult.rows.length > 0) {
      errors.push({ message: "Email already exists" });
      res.render("Register", { errors, roles });
    }

    let hashedPass = await bcrypt.hash(password, 10);
    await client.query(
      "INSERT INTO users (name, email, password, role_id) VALUES ($1, $2, $3, $4)",
      [name, email, hashedPass, role]
    );
    res.redirect("/blogs");
  } catch (error) {
    console.log(error);
    errors.push({ message: "Something went wrong, try again" });
    res.render("Register", { errors, roles });
  }
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: `/blogs`,
    failureRedirect: "/users/login",
    failureFlash: true,
  })
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
    res.redirect(`/blogs`);
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

function checkPermission(permission) {
  return async (req, res, next) => {
    const roleId = req.user.role_id;
    const permissionIdResult = await client.query(
      "SELECT * FROM rolehaspermission WHERE role_id =$1",
      [roleId]
    );

    const permissionsIds = permissionIdResult.rows.map(
      (row) => row.permission_id
    );

    if (permissionsIds.length > 0) {
      const permissionNameResult = await client.query(
        `SELECT per_name FROM permissions WHERE id = ANY($1)`,
        [permissionsIds]
      );

      const permissionNames = permissionNameResult.rows.map(
        (row) => row.per_name
      );
      if (permissionNames.includes(permission)) {
        return next();
      }
      res.render("AccessDenied");
    }
  };
}

function checkRole(role, permission) {
  return async (req, res, next) => {

    try {
      const permissionResult = await client.query(
        "SELECT id FROM permissions WHERE per_name= $1",
        [permission]
      );
      if (permissionResult.rows.length === 0) {
        return res.status(403).send("Permission not found");
      }
      const permissionId = permissionResult.rows[0].id;

      const result = await client.query(
        "SELECT * FROM rolehaspermission WHERE permission_id = $1",
        [permissionId]
      );
      // console.log(req.user.role_name)
      if (req.user.role_name === role || result.rows.length > 0) {
        return next();
      } else {
        return res
          .status(403)
          .send(
            "Access denied: you do not have permission to access this page"
          );
      }
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send("Access denied: you do not have permission to access this page");
    }
    // const roleIdResult= await client.query("SELECT role_id from users where id=$1", [req.user.id]);
    // const roleId= roleIdResult.rows[0].role_id;

    // const roleNameResult = await client.query(
    //     "SELECT role_name FROM roles WHERE id= $1",
    //     [roleId]
    //   );
    // const roleName = roleNameResult.rows[0].role_name;

    // if (roleName === role) {
    //   return next();
    // }
    // res.status(403).send("Access Denied");
  };
}

app.get(
  "/createblog",
  checkNotAuthenticated,
  checkPermission("Create Blogs"),
  (req, res) => {
    res.render("CreateBlog");
  }
);

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
  const q = req.query.q;
  if (q) {
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
    
    res.render("Blogcard", {
      blogs: blogsResult.rows,
      currentPage: page,
      totalPages: totalPages,
      user: req.user,
      q: ""
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
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching blogs");
  }
});

app.get(
  "/viewmyblog",
  checkPermission("View Own Blogs"),
  checkNotAuthenticated,
  async (req, res) => {
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
  }
);

app.get("/blogdata/:id", async (req, res) => {
  const { default: dateFormat } = await import("dateformat");
  const result = await client.query(
    `SELECT * FROM blogs where id= ${req.params.id}`
  );
  const blog = result.rows[0];
  const authorId= blog.author_id;
  const usernameResult=await client.query('SELECT name FROM users WHERE id = $1', [authorId]);
  const username=usernameResult.rows[0].name;
  // console.log(username.rows[0].name);
  
  blog.formatDate = dateFormat(blog.createdon, "dddd, mmmm dS, yyyy, h:MM TT");
  blog.editDate = dateFormat(blog.edited_at, "mmmm dS, yyyy, h:MM TT");
  res.render("blogdata", { blogs: result.rows[0] , username});
});

app.delete("/blogdata/:id", checkNotAuthenticated, async (req, res) => {
  const result = await client.query(`SELECT * FROM blogs where id=$1`, [
    req.params.id,
  ]);
  const blog = result.rows[0];

  if (blog.author_id !== req.user.id) {
    return res.status(403).send("you are not authorized");
  }
  await client.query(`DELETE FROM blogs where id=$1`, [req.params.id]);
  res.redirect("/blogs");
});

app.delete("/delete_blog/:id", async (req, res) => {
  const blogId = req.params.id;

  try {
    await client.query("DELETE FROM blogs WHERE id=$1", [blogId]);
    res.redirect("/blogs");
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).send("Error deleting the blog");
  }
});

app.get(
  "/modify_blogs",
  checkNotAuthenticated,
  checkPermission("Delete All Blogs"),
  async (req, res) => {
    try {
      const blogresult = await client.query("SELECT * FROM blogs");
      const blogs = blogresult.rows;
      res.render("DeleteAnyBlog", { blogs });
    } catch (error) {
      console.log(error);
      res.status(500).send("error fetching blogs");
    }
  }
);

app.put("/blogs/edit/:id", upload.single("image"), async (req, res) => {

  const { title, category, post } = req.body;

  const image = req.file ? `/uploads/${req.file.filename}` : null;
  const blogId = req.params.id;

  const editDate= new Date();


  try {
    if (image) {
      await client.query(
        "UPDATE blogs SET title = $1, category= $2, post = $3, image = $4, edited_at = $5 WHERE id = $6",
        [title, category, post, image, editDate, blogId]
      );
    } else {
      await client.query(
        "UPDATE blogs SET title = $1, category= $2, post = $3, edited_at= $4 WHERE id = $5",
        [title, category, post, editDate, blogId]
      );
    }
    // req.flash('success', 'Blog updated successfully!');
    res.redirect("/blogs");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error updating blog");
  }
});

app.post("/blogs", upload.single("image"), async (req, res) => {
  const blogData = {
    title: req.body.title,
    category: req.body.category,
    image: req.file ? `/uploads/${req.file.filename}` : null, // Use the randomly generated filename
    post: req.body.post,
    author_id: req.user.id,
  };
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

app.get("/se1", async (req, res) => {
  const q = req.query.q||"";

  try {
    let results;
    let message = "";
    if (q) {
      results = await client.query(
        "SELECT * FROM blogs WHERE title ILIKE $1 OR post ILIKE $1",
        [`%${q}%`]
      );
      // console.log(results.rows);
      if (results.rowCount === 0) {
        message = "No blogs found matching your search";
      }
    } else {
      results = await client.query("SELECT * FROM blogs");
    }
    // console.log(message);
    res.render("Blogcard", {
      blogs: results.rows,
      currentPage: 1,
      totalPages: 1,
      q: q || "",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error searching blog");
  }
});

app.get(
  "/seeUsers",
  checkNotAuthenticated,
  checkPermission("See All Users"),
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

app.get(
  "/blogs/edit/:id",
  checkNotAuthenticated,
  checkPermission("Edit Blogs"),
  async (req, res) => {
    try {
      const blog = await client.query("SELECT * FROM blogs WHERE id= $1", [
        req.params.id,
      ]);
      res.render("EditBlog", { blogs: blog.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error fetching data");
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
    res.redirect("/blogs");
  } catch (error) {
    console.log(error);
    res.status(500).send("error updating user role");
  }
});

app.get(
  "/admin",
  checkNotAuthenticated,
  checkPermission("Admin Panel"),
  async (req, res) => {
    res.render("Adminpage");
  }
);

app.get(
  "/changeRolePerm",
  checkNotAuthenticated,
  checkPermission("See All Users"),
  async (req, res) => {
    res.render("Changepermissions");
  }
);

app.get(
  "/createrole",
  checkNotAuthenticated,
  checkPermission("Create Role"),
  async (req, res) => {
    const permission = await client.query("SELECT * FROM permissions");
    res.render("Createrole", {
      permissions: permission.rows,
    });
  }
);

app.post("/createrole", async (req, res) => {
  const { rolename } = req.body;
  // const permissions = req.body["permissions[]"] || [];
  const permissionResult = req.body.permissions;
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

    if (permissionResult.length > 0) {
      await Promise.all(
        permissionResult.map(async (permissionid) => {
          return client.query(
            "INSERT INTO rolehaspermission (role_id, permission_id) VALUES ($1, $2)",
            [roleid, permissionid]
          );
        })
      );
    }
    res.redirect("/blogs");
  } catch (error) {
    console.log(error);
    res.status(500).send("error catching role");
  }
});

app.get("/profile", checkNotAuthenticated, async (req, res) => {

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
    // const permissionIdsString = permissionsIds.join(",");
    // console.log(permissionIdsString);
    const permissionNameResult = await client.query(
      `SELECT per_name FROM permissions WHERE id = ANY($1)`,
      [permissionsIds]
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
