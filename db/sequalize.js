const { Sequelize } = require("sequelize");

// const { createUser } = require("../models/users");

const sequelize = new Sequelize("blogdb", "postgres", "Jiya@123", {
  host: "localhost",
  dialect: "postgres",
  logging: false,
});

// let userModel = null;

const connection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");

    // userModel = await createUser(sequelize);
    await sequelize.sync();
    // console.log(await userModel.count());
    console.log("Database Synced");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};
module.exports = { sequelize, connection };
