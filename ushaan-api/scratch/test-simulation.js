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

    // Let's create a temporary user
    const userRes = await client.query(
      `INSERT INTO "user" (name, email, password, role, "monthlyAmount", "createdAt")
       VALUES ('Test User Dues', 'testdues@example.com', 'hashedpassword', 'member', 200, '2026-05-15T00:00:00.000Z')
       RETURNING id`
    );
    const userId = userRes.rows[0].id;
    console.log('Created Test User with ID:', userId);

    // Let's generate/publish June sheet (month 6, year 2026)
    // First check if June sheet exists
    let JuneSheetId;
    const juneRes = await client.query('SELECT id FROM monthly_sheet WHERE month = 6 AND year = 2026');
    if (juneRes.rows.length > 0) {
      JuneSheetId = juneRes.rows[0].id;
    } else {
      const insertJune = await client.query(
        `INSERT INTO monthly_sheet (month, year, "totalMemberIncome", "totalProjectIncome", "totalSalary", "previousBalance", "cashInHand", "totalInvested", "totalAsset", status, "totalProjectExpense", "totalGeneralExpense", "totalCapitalReturn")
         VALUES (6, 2026, 0, 0, 0, 0, 0, 0, 0, 'published', 0, 0, 0)
         RETURNING id`
      );
      JuneSheetId = insertJune.rows[0].id;
    }
    console.log('June Sheet ID:', JuneSheetId);

    // Let's generate/publish July sheet (month 7, year 2026)
    let JulySheetId;
    const julyRes = await client.query('SELECT id FROM monthly_sheet WHERE month = 7 AND year = 2026');
    if (julyRes.rows.length > 0) {
      JulySheetId = julyRes.rows[0].id;
    } else {
      const insertJuly = await client.query(
        `INSERT INTO monthly_sheet (month, year, "totalMemberIncome", "totalProjectIncome", "totalSalary", "previousBalance", "cashInHand", "totalInvested", "totalAsset", status, "totalProjectExpense", "totalGeneralExpense", "totalCapitalReturn")
         VALUES (7, 2026, 0, 0, 0, 0, 0, 0, 0, 'published', 0, 0, 0)
         RETURNING id`
      );
      JulySheetId = insertJuly.rows[0].id;
    }
    console.log('July Sheet ID:', JulySheetId);

    // Function to simulate backend findOne for our user
    const checkUserStatus = async (sheetId, month, year) => {
      // Fetch all approved payments for our user
      const resPayments = await client.query(
        'SELECT * FROM payment WHERE "userId" = $1 AND status = \'approved\'',
        [userId]
      );
      const memberApprovedPayments = resPayments.rows;

      const paidDues = [];
      const unpaidDues = [];

      // Trace from join date to sheet month/year (exclusive)
      let checkMonth = 6; // join month is June (6)
      let checkYear = 2026;

      while (checkYear < year || (checkYear === year && checkMonth < month)) {
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
          if (capYear < year || (capYear === year && capMonth <= month)) {
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
        let covers = p.month === month && p.year === year;
        if (!covers && p.coveredMonths) {
          try {
            const covered = JSON.parse(p.coveredMonths);
            covers = covered.some(c => c.month === month && c.year === year);
          } catch {}
        }
        return covers && (capYear < year || (capYear === year && capMonth <= month));
      });

      console.log(`\n--- Status for Sheet ${month}/${year} ---`);
      console.log('Current Month Payment:', currentPayment ? 'Found' : 'Not Found');
      console.log('Status (paid/due):', currentPayment ? 'paid' : 'due');
      console.log('unpaidDues:', unpaidDues);
      console.log('paidDues:', paidDues);
    };

    // Case 1: No payments at all
    console.log('\n=== CASE 1: No payments at all ===');
    await checkUserStatus(JuneSheetId, 6, 2026);
    await checkUserStatus(JulySheetId, 7, 2026);

    // Case 2: User pays June's fee after June's sheet is published
    console.log('\n=== CASE 2: User pays June\'s fee (approved and captured in July) ===');
    const paymentRes = await client.query(
      `INSERT INTO payment ("userId", month, year, amount, status, "capturedInMonth", "capturedInYear")
       VALUES ($1, 6, 2026, 200, 'approved', 7, 2026)
       RETURNING id`,
      [userId]
    );
    const paymentId = paymentRes.rows[0].id;
    console.log('Created payment for June, ID:', paymentId);

    await checkUserStatus(JuneSheetId, 6, 2026);
    await checkUserStatus(JulySheetId, 7, 2026);

    // Clean up
    await client.query('DELETE FROM payment WHERE "userId" = $1', [userId]);
    await client.query('DELETE FROM "user" WHERE id = $1', [userId]);
    console.log('\nCleaned up database.');

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
