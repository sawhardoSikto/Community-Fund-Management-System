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
    console.log('Connected to database!');

    const resSheets = await client.query('SELECT id, month, year, status FROM monthly_sheet ORDER BY year DESC, month DESC');
    console.log('\n--- Sheets ---');
    console.table(resSheets.rows);

    const resPayments = await client.query('SELECT id, "userId", month, year, amount, status, "capturedInMonth", "capturedInYear", "coveredMonths" FROM payment ORDER BY year DESC, month DESC');
    console.log('\n--- Payments ---');
    console.table(resPayments.rows.map(p => ({
      ...p,
      coveredMonths: p.coveredMonths
    })));

    const resUsers = await client.query('SELECT id, name, role, "monthlyAmount" FROM "user"');
    console.log('\n--- Users ---');
    console.table(resUsers.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
