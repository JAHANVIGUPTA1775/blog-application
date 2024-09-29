const express=require("express")
const router= express.Router();
const client = require("../db/conn.js");
const {checkNotAuthenticated}= require("../middlewares");

router.get("/", checkNotAuthenticated, async (req, res) => {

    const roleId = req.user.role_id;
    const roleNameResult = await client.query(
      "SELECT role_name FROM roles WHERE id= $1",
      [roleId]
    );
    const roleName = roleNameResult.rows[0].role_name;
    // console.log(roleName);
  
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
      res.render("Profile", { permissionNames: [], roleName });
    }
  });

  module.exports= router;