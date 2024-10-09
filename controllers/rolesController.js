const Permission = require("../models/permissions.js");
const Roles = require("../models/roles.js");
const RoleHasPermission = require("../models/rolehaspermission.js");

getCreateRole = async (req, res) => {
  const permission = await Permission.findAll();
  // const permission = await client.query("SELECT * FROM permissions");
  res.render("Createrole", {
    permissions: permission,
  });
};

postCreateRole = async (req, res) => {
  const { rolename } = req.body;
  console.log(req.body);
  // const permissions = req.body["permissions[]"] || [];
  const permissionResult = req.body.permissions;
  console.log(permissionResult);
  try {
    const existinguser = await Roles.findOne({
      where: { role_name: rolename },
    });
    // const existinguser = await client.query(
    //   "SELECT * FROM roles where role_name =$1",
    //   [rolename]
    // );

    if (existinguser) {
      return res.json({
        success: false,
        message: "Role name already exists",
      });
      // res.status(400).send("role name already exists");
    }

    const newRole = await Roles.create({
      role_name: rolename,
    });

    if (permissionResult.length > 0) {
      for (const permissionId of permissionResult) {
        await RoleHasPermission.create({
          role_id: newRole.id,
          permission_id: permissionId,
        });
      }
    }

    return res.json({
      success: true,
      message: "Role created successfully",
    });
    // const result = await client.query(
    //   "INSERT INTO roles (role_name) VALUES ($1) RETURNING id",
    //   [rolename]
    // );
    // const roleid = newRole.id;

    // if (permissionResult.length > 0) {
    //   await Promise.all(
    //     permissionResult.map(async (permissionid) => {
    //       return client.query(
    //         "INSERT INTO rolehaspermission (role_id, permission_id) VALUES ($1, $2)",
    //         [roleid, permissionid]
    //       );
    //     })
    //   );
    // }

    // res.redirect("/blogs");
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Error creating role",
    });
    // res.status(500).send("error catching role");
  }
};

module.exports = { getCreateRole, postCreateRole };
