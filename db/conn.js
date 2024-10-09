const { Client } = require('pg');
require("dotenv").config()

const client = new Client({
    // connectionString: process.env.POSTGRES_URL,
    user: 'postgres',
    password:'Jiya@123',
    host: 'localhost',
    port: 5432,
    database: 'blogdb',
  });

async function check(){
    await client.connect()
    // await client.query("SET search_path TO public");
}

check();
module.exports=client;