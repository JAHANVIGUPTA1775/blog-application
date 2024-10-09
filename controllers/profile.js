const User = require("../models/users.js");
const Role = require("../models/roles.js");
const RoleHasPermission = require("../models/rolehaspermission.js");
const Permission = require("../models/permissions.js");
const { Op } = require("sequelize");

getProfilePage = async (req, res) => {
  try {
    const roleId = req.user.role_id;

    const role = await Role.findOne({ where: { id: roleId } });
    const roleName = role.role_name;

    const permissionIdResult = await RoleHasPermission.findAll({
      where: { role_id: roleId },
    });
    // const roleNameResult = await client.query(
    //   "SELECT role_name FROM roles WHERE id= $1",
    //   [roleId]
    // );
    // const roleName = roleNameResult.rows[0].role_name;
    // console.log(roleName);
    // const permissionIdResult = await client.query(
    //   "SELECT * FROM rolehaspermission WHERE role_id =$1",
    //   [roleId]
    // );

    const permissionsIds = permissionIdResult.map((row) => row.permission_id);

    if (permissionsIds.length > 0) {
      const permissionNameResult = await Permission.findAll({
        where: {
          id: {
            [Op.in]: permissionsIds,
          },
        },
      });
      // const permissionNameResult = await client.query(
      //   `SELECT per_name FROM permissions WHERE id = ANY($1)`,
      //   [permissionsIds]
      // );

      const permissionNames = permissionNameResult.map((row) => row.per_name);
      res.render("Profile", { permissionNames, roleName });
    } else {
      res.render("Profile", { permissionNames: [], roleName });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching profile data");
  }
};

module.exports = { getProfilePage };
