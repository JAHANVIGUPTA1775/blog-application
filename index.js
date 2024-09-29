const express= require("express");
const { connection }= require("./db/sequalize")

const app=express();
const port= 3000

console.log(connection);




app.listen(port, async () => {
  console.log("starting database connection");
  await connection();
    console.log(`Example app listening on port ${port}`);
  });
  