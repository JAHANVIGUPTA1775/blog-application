const express = require("express");
const router = express.Router();
const { checkNotAuthenticated } = require("../middlewares");
const { checkPermission } = require("../middlewares");
const {
  seeAllUsers,
  changeUserRole,
  registerPage,
  registerUser,
  deleteUser
} = require("../controllers/usersController");
const { checkAuthenticated } = require("../middlewares");
const passport = require("passport");

router.get(
  "/seeUsers",
  checkNotAuthenticated,
  checkPermission("See All Users"),
  seeAllUsers
);

router.post("/seeUsers", changeUserRole);

router.get(
  "/users/register",
  checkNotAuthenticated,
  checkPermission("Create User"),
  registerPage
);

router.post("/users/register", registerUser);

router.get("/users/logout", (req, res) => {
  req.logOut(() => {
    res.redirect(`/blogs`);
  });
});

router.get("/users/login", checkAuthenticated, (req, res) => {
  return res.render("Login");
});

router.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: `/blogs`,
    failureRedirect: "/users/login",
    failureFlash: true,
  })
);

router.post("/users/delete/:id", deleteUser);

module.exports = router;
