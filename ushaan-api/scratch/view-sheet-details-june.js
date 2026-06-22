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

    // Let's get sheet 45 (June 2026)
    const resSheet = await client.query('SELECT * FROM monthly_sheet WHERE id = 45');
    const sheet = resSheet.rows[0];
    console.log('Sheet:', sheet);

    // Let's fetch all users
    const resUsers = await client.query('SELECT id, name, role, "monthlyAmount", "createdAt" FROM "user"');
    const users = resUsers.rows;

    // Let's fetch all approved payments
    const resPayments = await client.query('SELECT * FROM payment WHERE status = \'approved\'');
    const payments = resPayments.rows;

    // Simulate backend findOne logic for each user
    const memberPaymentStatus = users.map((member) => {
      const memberApprovedPayments = payments.filter(p => p.userId === member.id);

      const paidDues = [];
      const unpaidDues = [];

      // Trace from member join date to this sheet's month/year (exclusive)
      let checkMonth = member.createdAt.getMonth() + 1;
      let checkYear = member.createdAt.getFullYear();

      while (checkYear < sheet.year || (checkYear === sheet.year && checkMonth < sheet.month)) {
        const coveringPayment = memberApprovedPayments.find(p => {
          if (p.month === checkMonth && p.year === checkYear) return true;
          if (!p.coveredMonths) return false;
          try {
            const covered = JSON.parse(p.coveredMonths);
            return covered.some(c => c.month === checkMonth && c.year === checkYear);
          } catch {
            return false;
          }
        });

        if (coveringPayment) {
          const capYear = coveringPayment.capturedInYear ?? coveringPayment.year;
          const capMonth = coveringPayment.capturedInMonth ?? coveringPayment.month;
          if (capYear < sheet.year || (capYear === sheet.year && capMonth <= sheet.month)) {
            paidDues.push({ month: checkMonth, year: checkYear });
          } else {
            unpaidDues.push({ month: checkMonth, year: checkYear });
          }
        } else {
          unpaidDues.push({ month: checkMonth, year: checkYear });
        }

        checkMonth++;
        if (checkMonth > 12) {
          checkMonth = 1;
          checkYear++;
        }
      }

      // Check current month
      const currentPayment = memberApprovedPayments.find(p => {
        const capYear = p.capturedInYear ?? p.year;
        const capMonth = p.capturedInMonth ?? p.month;
        let covers = p.month === sheet.month && p.year === sheet.year;
        if (!covers && p.coveredMonths) {
          try {
            const covered = JSON.parse(p.coveredMonths);
            covers = covered.some(c => c.month === sheet.month && c.year === sheet.year);
          } catch {}
        }
        return covers && (capYear < sheet.year || (capYear === sheet.year && capMonth <= sheet.month));
      });

      const paidCurrent = !!currentPayment;

      return {
        id: member.id,
        name: member.name,
        status: paidCurrent ? 'paid' : 'due',
        unpaidDues,
        paidDues,
      };
    });

    console.log('\n--- Member Payment Statuses for June Sheet ---');
    console.log(JSON.stringify(memberPaymentStatus, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
