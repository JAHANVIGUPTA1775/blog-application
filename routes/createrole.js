const express=require("express")
const router= express.Router();
const client = require("../db/conn.js");
const {checkNotAuthenticated}= require("../middlewares")
const {checkPermission}= require("../middlewares")


router.get(
    "/",
    checkNotAuthenticated,
    checkPermission("Create Role"),
    async (req, res) => {
      const permission = await client.query("SELECT * FROM permissions");
      res.render("Createrole", {
        permissions: permission.rows,
      });
    }
  );

router.post("/", async (req, res) => {
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

  module.exports=router;