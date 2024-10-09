const User = require("../models/users.js");
const Role = require("../models/roles.js");
const bcrypt = require("bcrypt");
// const { submitHandler } = require("ckeditor5");

seeAllUsers = async (req, res) => {
  try {
    const users = await User.findAll(); // Fetch all users
    const roles = await Role.findAll(); // Fetch all roles
    // const permissions = await Permission.findAll(); // Fetch all permissions
    // const rolePermissions = await RolePermission.findAll();
    // const users = await client.query("SELECT * FROM users");
    // const roles = await client.query("SELECT * FROM roles");
    // const permissions = await client.query("SELECT * FROM permissions");
    // const rolePermissions = await client.query(
    //   "SELECT * FROM rolehaspermission"
    // );

    // const rolePermissionMap = {};
    // rolePermissions.rows.forEach((rp) => {
    //   if (!rolePermissionMap[rp.role_id]) {
    //     rolePermissionMap[rp.role_id] = [];
    //   }
    //   rolePermissionMap[rp.role_id].push(rp.permission_id);
    // });

    // console.log(roles);

    res.render("Users", {
      users: users,
      roles: roles,
    });
    // res.render("Users", {
    //   users: users.rows,
    //   roles: roles.rows,
    //   permissions: permissions.rows,
    //   rolePermissionMap,
    // });
  } catch (err) {
    console.log(err);
    res.status(500).send("error fetching data");
  }
};

changeUserRole = async (req, res) => {
  const { userid, roleid } = req.body;

  try {
    // await client.query("UPDATE users SET role_id=$1 WHERE id=$2", [
    //   roleid,
    //   userid,
    // ]);
    await User.update({ role_id: roleid }, { where: { id: userid } });
    res.redirect("/seeUsers");
  } catch (error) {
    console.log(error);
    res.status(500).send("error updating user role");
  }
};

registerPage = async (req, res) => {
  try {
    const roles = await Role.findAll();
    // const roles = await client.query("SELECT * FROM roles");
    res.render("Register", { roles: roles });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
};

registerUser = async (req, res) => {
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
  const roles = await Role.findAll();
  // const roleResult = await client.query(`SELECT * FROM roles`);
  // const roles = roleResult.rows;
  if (errors.length > 0) {
    // return res.render("register", { errors, roles });
    return res.json({
      success: false,
      message: "Validation Failed",
      errors,
      roles,
    });
  }

  try {
    // const emailResult = await client.query(
    //   `SELECT * FROM users WHERE email= $1`,
    //   [email]
    // );
    const emailResult = await User.findOne({ where: { email: email } });
    if (emailResult > 0) {
      errors.push({ message: "Email already exists" });
      // return res.render("Register", { errors, roles });
      return res.json({
        success: false,
        message: "Email already exists",
        errors,
        roles,
      });
    }

    let hashedPass = await bcrypt.hash(password, 10);

    await User.create({
      name: name,
      email: email,
      password: hashedPass,
      role_id: role,
    });
    // await client.query(
    //   "INSERT INTO users (name, email, password, role_id) VALUES ($1, $2, $3, $4)",
    //   [name, email, hashedPass, role]
    // );
    // res.redirect("/blogs");
    return res.json({
      success: true,
      message: "User registered successfully",
      roles,
    });
  } catch (error) {
    console.log(error);
    errors.push({ message: "Something went wrong, try again" });
    // res.render("Register", { errors, roles });
    return res.json({
      success: false,
      message: "Something went wrong, try again",
      errors,
      roles,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    // console.log(req.params.id);
    await User.update({ status: false }, { where: { id: req.params.id } });

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Error deleting user",
    });
  }
};

module.exports = {
  seeAllUsers,
  changeUserRole,
  registerPage,
  registerUser,
  deleteUser,
};
