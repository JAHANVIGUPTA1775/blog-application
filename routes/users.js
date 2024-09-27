const express= require("express");
const router = express.Router();
const {checkNotAuthenticated}= require("../middlewares")
const {checkPermission}= require("../middlewares")
const client = require("../db/conn.js");

router.get(
    "/",
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

  
router.post("/", async (req, res) => {
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
  

  module.exports=router;