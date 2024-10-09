const { DataTypes } =require("sequelize");
const { sequelize } = require("../db/sequalize");

// const createUser=async(sequelize)=>{
    const User = sequelize.define('users', {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true, 
          primaryKey: true,
          
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(100),
          unique:true,
          allowNull: false,
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        role_id: {
          type: DataTypes.INTEGER,
        },
        status:{
          type:DataTypes.BOOLEAN,
          defaultValue: true
        }
      }, {
        timestamps: false
      });
      
//       return User;
// }

// User.sync({alter:true}).then((data)=>{
//   console.log("Table and model synced successfully");
// }).catch((err)=>{
//   console.log("Error syncing table and model");
// })
module.exports=User;