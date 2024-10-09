const express = require("express");
const router = express.Router();
const { checkNotAuthenticated } = require("../middlewares");
const { getProfilePage } = require("../controllers/profile");

router.get("/", checkNotAuthenticated, getProfilePage);

module.exports = router;
