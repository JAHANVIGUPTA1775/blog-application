const { DataTypes } =require("sequelize");
const { sequelize } = require("../db/sequalize");

// const createCategory=async(sequelize)=>{
    const categories = sequelize.define('categories', {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true, 
          primaryKey: true,
          
        },
        category_name: {
          type: DataTypes.STRING,
          unique: true, 
          allowNull:false,
        }
      }, {
        tableName: 'categories',  
        timestamps: false,
      });
      
  //     return categories;
  // }

  module.exports=categories;