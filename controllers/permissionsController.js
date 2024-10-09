

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
