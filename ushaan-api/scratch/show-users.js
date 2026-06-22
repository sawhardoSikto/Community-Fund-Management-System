const { Client } = require('pg');

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
    const res = await client.query('SELECT id, name, email, phone, nid, role FROM "user"');
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
