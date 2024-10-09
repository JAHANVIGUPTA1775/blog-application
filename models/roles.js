const { DataTypes } =require("sequelize");
const { sequelize } = require("../db/sequalize");

// const createRole=async(sequelize)=>{
    const Role = sequelize.define('roles', {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true, 
          primaryKey: true,
          
        },
        role_name: {
          type: DataTypes.STRING,
          unique: true, 
          allowNull:false,
        }
      }, {
        tableName: 'roles',  
        timestamps: false,
      });
      
  //     return Role;
  // }

  module.exports=Role;