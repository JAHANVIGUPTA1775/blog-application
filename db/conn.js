const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    password:'Jiya@123',
    host: 'localhost',
    port: 5432,
    database: 'blogdb',
  });

async function check(){
    await client.connect()
}

check();
module.exports=client;