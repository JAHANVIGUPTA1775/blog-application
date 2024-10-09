const express = require("express");
const router = express.Router();
const { checkNotAuthenticated } = require("../middlewares");
const { checkPermission } = require("../middlewares");
const { getCreateRole, postCreateRole } = require("../controllers/rolesController");

router.get(
  "/createrole",
  checkNotAuthenticated,
  checkPermission("Create Role"),
  getCreateRole
);

router.post("/createrole", postCreateRole);

module.exports = router;
