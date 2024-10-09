const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/sequalize");

const blogDb = sequelize.define(
  "blogs",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    post: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
    },
    createdon: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    edited_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "blogs",
    timestamps: false,
  }
);

module.exports = blogDb;
