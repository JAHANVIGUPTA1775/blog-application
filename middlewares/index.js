const client = require("../db/conn.js");
const passport = require("passport");


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

        if(!req.user){
            return res.redirect("/users/login");
        }

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

  
// function checkRole(role, permission) {
//     return async (req, res, next) => {
  
//       try {
//         const permissionResult = await client.query(
//           "SELECT id FROM permissions WHERE per_name= $1",
//           [permission]
//         );
//         if (permissionResult.rows.length === 0) {
//           return res.status(403).send("Permission not found");
//         }
//         const permissionId = permissionResult.rows[0].id;
  
//         const result = await client.query(
//           "SELECT * FROM rolehaspermission WHERE permission_id = $1",
//           [permissionId]
//         );
//         // console.log(req.user.role_name)
//         if (req.user.role_name === role || result.rows.length > 0) {
//           return next();
//         } else {
//           return res
//             .status(403)
//             .send(
//               "Access denied: you do not have permission to access this page"
//             );
//         }
//       } catch (error) {
//         console.log(error);
//         return res
//           .status(500)
//           .send("Access denied: you do not have permission to access this page");
//       }
//       // const roleIdResult= await client.query("SELECT role_id from users where id=$1", [req.user.id]);
//       // const roleId= roleIdResult.rows[0].role_id;
  
//       // const roleNameResult = await client.query(
//       //     "SELECT role_name FROM roles WHERE id= $1",
//       //     [roleId]
//       //   );
//       // const roleName = roleNameResult.rows[0].role_name;
  
//       // if (roleName === role) {
//       //   return next();
//       // }
//       // res.status(403).send("Access Denied");
//     };
//   }

module.exports= {checkAuthenticated, checkNotAuthenticated, checkPermission};
