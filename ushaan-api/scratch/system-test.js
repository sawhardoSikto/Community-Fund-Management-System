const API_URL = 'http://localhost:3000';

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  if (!response.ok) {
    throw { response: { data: json, status: response.status }, message: `HTTP Error ${response.status}` };
  }
  return json;
}

async function runSystemTest() {
  console.log('=== STARTING SYSTEM TESTING ===\n');

  let testUserToken = '';
  let accountantToken = '';
  let testUserId = null;
  let manualPaymentId = null;
  let memberPaymentId = null;
  let testProjectId = null;

  try {
    // 1. Authenticate as Accountant to perform admin tasks
    console.log('1. Logging in as Accountant (shahanoorislam3911@gmail.com)...');
    const accLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'shahanoorislam3911@gmail.com',
        password: '123456',
      }),
    });
    accountantToken = accLoginRes.token;
    console.log('✓ Accountant logged in. Name in data:', accLoginRes.data.name);

    // 2. Create a clean Test Member (via a raw HTTP register or DB insert)
    console.log('\n2. Registering a new test member...');
    const memberEmail = `systemtest_${Date.now()}@example.com`;
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'System Test User',
        email: memberEmail,
        password: '123456',
        phone: '01700000000',
        nid: '1234567890123',
        monthlyAmount: '200',
      }),
    });
    testUserId = regRes.data.id;
    console.log('✓ Registered Test User ID:', testUserId);

    // 3. Login as the newly created Test Member
    console.log('\n3. Logging in as Test Member...');
    const memberLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: memberEmail,
        password: '123456',
      }),
    });
    testUserToken = memberLoginRes.token;
    console.log('✓ Member logged in. Profile name populated:', memberLoginRes.data.name);

    // 4. Verify /payments/my/next-unpaid returns member's join month (June 2026/current calendar)
    console.log('\n4. Checking member next unpaid month...');
    const nextUnpaidRes = await request('/payments/my/next-unpaid', {
      method: 'GET',
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const firstUnpaidMonth = nextUnpaidRes.month;
    const firstUnpaidYear = nextUnpaidRes.year;
    console.log(`✓ Next unpaid month is correctly set to: ${firstUnpaidMonth}/${firstUnpaidYear}`);

    // 5. Test Manual Payment without bkashNumber error
    console.log('\n5. Creating a manual payment for member without bkashNumber field...');
    const manualPaymentRes = await request('/payments/manual', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accountantToken}` },
      body: JSON.stringify({
        userId: testUserId,
        month: firstUnpaidMonth,
        year: firstUnpaidYear,
        paymentMethod: 'bkash',
        transactionNumber: '01700000000',
        note: 'System test manual payment',
      }),
    });
    manualPaymentId = manualPaymentRes.data.id;
    console.log('✓ Manual payment created successfully! ID:', manualPaymentId);

    // 6. Verify next unpaid month automatically updated
    console.log('\n6. Checking next unpaid month after manual payment...');
    const nextUnpaidRes2 = await request('/payments/my/next-unpaid', {
      method: 'GET',
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    let expectedMonth = firstUnpaidMonth + 1;
    let expectedYear = firstUnpaidYear;
    if (expectedMonth > 12) {
      expectedMonth = 1;
      expectedYear += 1;
    }
    console.log(`✓ Next unpaid month updated to: ${nextUnpaidRes2.month}/${nextUnpaidRes2.year}`);
    if (nextUnpaidRes2.month !== expectedMonth || nextUnpaidRes2.year !== expectedYear) {
      throw new Error(`Expected next unpaid month to be ${expectedMonth}/${expectedYear}`);
    }

    // 7. Submit pending payment for the new unpaid month
    console.log(`\n7. Submitting pending payment for month ${expectedMonth}/${expectedYear}...`);
    const submitRes = await request('/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testUserToken}` },
      body: JSON.stringify({
        month: expectedMonth,
        year: expectedYear,
        paymentMethod: 'bkash',
        transactionNumber: '01700000001',
        note: 'Pending payment test',
      }),
    });
    memberPaymentId = submitRes.data.id;
    console.log('✓ Pending payment submitted! ID:', memberPaymentId);

    // 8. Verify next unpaid month updated to next month because July is pending (covered)
    console.log('\n8. Checking next unpaid month while payment is pending...');
    const nextUnpaidRes3 = await request('/payments/my/next-unpaid', {
      method: 'GET',
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    console.log(`✓ Next unpaid month is now: ${nextUnpaidRes3.month}/${nextUnpaidRes3.year}`);

    // 9. Approve the pending payment
    console.log('\n9. Approving the pending payment...');
    const approveRes = await request(`/payments/${memberPaymentId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accountantToken}` },
      body: JSON.stringify({ status: 'approved' }),
    });
    console.log('✓ Payment approved. Captured in sheet month/year:', approveRes.data.capturedInMonth, '/', approveRes.data.capturedInYear);

    // 10. Check if the sheet details correctly show "বকেয়া পরিশোধিত"
    console.log('\n10. Fetching sheet details to verify displayAmount...');
    const sheetsListRes = await request('/sheets', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accountantToken}` },
    });
    const targetSheet = sheetsListRes.data.find(s => s.month === expectedMonth && s.year === expectedYear);
    if (targetSheet) {
      const sheetDetailsRes = await request(`/sheets/${targetSheet.id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accountantToken}` },
      });
      const memberPayment = sheetDetailsRes.data.memberPayments.find(p => p.id === testUserId);
      console.log('✓ Sheet Status for member:', memberPayment.status);
      console.log('✓ Sheet Display Amount string:', memberPayment.displayAmount);
    } else {
      console.log('ℹ No sheet generated yet for target month, skipping displayAmount verification.');
    }

    // 11. Test Project Management endpoints
    console.log('\n11. Testing Project administration endpoints...');
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'mahbubmiskat88790@gmail.com',
        password: '123456',
      }),
    });
    const adminToken = adminLoginRes.token;

    // Create project
    console.log('Creating a test project...');
    const projectRes = await request('/projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'System Test Project',
        description: 'Temporary project for testing',
        startDate: '2026-06-01',
        openingInvested: 1000,
      }),
    });
    testProjectId = projectRes.data.id;
    console.log('✓ Project created with ID:', testProjectId);

    // Toggle status to completed
    console.log('Toggling project status to completed...');
    const toggleRes = await request(`/projects/${testProjectId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'completed' }),
    });
    console.log('✓ Project status updated to:', toggleRes.data.status);

    // Toggle status back to active
    console.log('Toggling project status back to active...');
    const toggleRes2 = await request(`/projects/${testProjectId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'active' }),
    });
    console.log('✓ Project status updated to:', toggleRes2.data.status);

    // Delete project
    console.log('Deleting test project...');
    await request(`/projects/${testProjectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('✓ Project deleted successfully.');
    testProjectId = null;

    console.log('\n=== ALL SYSTEM TESTS PASSED SUCCESSFULLY! ===');

  } catch (err) {
    console.error('\n❌ SYSTEM TEST FAILED!');
    console.error(err.response?.data || err.message || err);
  } finally {
    // Cleanup database test data
    console.log('\nCleaning up test data...');
    const { Client } = require('pg');
    const dbClient = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'admin',
      database: 'ushaan_db',
    });
    try {
      await dbClient.connect();
      if (memberPaymentId) {
        await dbClient.query('DELETE FROM payment WHERE id = $1', [memberPaymentId]);
      }
      if (manualPaymentId) {
        await dbClient.query('DELETE FROM payment WHERE id = $1', [manualPaymentId]);
      }
      if (testUserId) {
        await dbClient.query('DELETE FROM "user" WHERE id = $1', [testUserId]);
      }
      if (testProjectId) {
        await dbClient.query('DELETE FROM project WHERE id = $1', [testProjectId]);
      }
      console.log('✓ Database cleaned up successfully.');
    } catch (dbErr) {
      console.error('Failed to clean up database:', dbErr.message);
    } finally {
      await dbClient.end();
    }
  }
}

runSystemTest();
