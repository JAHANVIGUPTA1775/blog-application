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
    
    // const res = await client.query('SELECT * FROM blogs');
    // console.log(res.rows[0]) 
    // await client.end()
}
check();
module.exports=client;