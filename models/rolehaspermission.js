const { DataTypes } =require("sequelize");
const { sequelize } = require("../db/sequalize");

// const createRoleHasPermission = async(sequelize)=>{
    const RoleHasPermission = sequelize.define('rolehaspermission', {
        role_id: {
          type:DataTypes.INTEGER,
          allowNull:false,
          primaryKey:true,
          references: {
            model: 'roles', // Ensure this references the correct table
            key: 'role_id'
          }
        },
        permission_id:{
          type:DataTypes.INTEGER,
          allowNull:false,
          primaryKey:true,
          references: {
            model: 'permissions', // Ensure this references the correct table
            key: 'id'
          }
        }
      }, {
        tableName: 'rolehaspermission',  
        timestamps: false
      });
      
  //     return RoleHasPermission;
  // }

  module.exports=RoleHasPermission;