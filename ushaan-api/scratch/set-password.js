const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'admin',
    database: 'ushaan_db',
  });

  try {
    await client.connect();
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Set password for all users to 123456
    await client.query('UPDATE "user" SET password = $1', [hashedPassword]);
    console.log('Successfully set password for all users to "123456"!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
