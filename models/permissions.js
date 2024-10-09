const { DataTypes } =require("sequelize");
const { sequelize } = require("../db/sequalize");

// const createPermission=async(sequelize)=>{
    const permission = sequelize.define('permissions', {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true, 
          primaryKey: true,
          
        },
        per_name: {
          type: DataTypes.STRING,
          unique: true, 
          allowNull:false,
        }
      }, {
        tableName: 'permissions',  
        timestamps: false,
      });
      
  //     return permission;
  // }

  // module.exports={createPermission};
  module.exports=permission;