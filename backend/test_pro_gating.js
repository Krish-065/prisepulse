require('dotenv').config();
const { query } = require('./src/db/index');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'Nonstock-super-secret-key-2025';
const PORT = 5057;
process.env.PORT = PORT; // override port to avoid conflict

// Boot backend app
require('./src/index');

// Wait 2 seconds for DB and server to start up
setTimeout(async () => {
  try {
    await runTest();
  } catch (e) {
    console.error('❌ Test failed with error:', e);
    process.exit(1);
  }
}, 2000);

async function runTest() {
  try {
    console.log('🚀 Starting NonStock Pro Membership integration test...');

  // 1. Create a mock standard user
  const userId = 'user_pro_' + crypto.randomBytes(4).toString('hex');
  const userEmail = `pro_test_${userId}@test.com`;
  
  await query(
    `INSERT INTO users (id, name, email, password) 
     VALUES ($1, $2, $3, $4)`,
    [userId, 'Pro Tester', userEmail, 'password123']
  );

  // 2. Create mock session
  const sessionId = 'sess_pro_' + crypto.randomBytes(4).toString('hex');
  await query(
    `INSERT INTO sessions (id, user_id, token, expires_at) 
     VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour')`,
    [sessionId, userId, sessionId]
  );

  console.log('✅ Mock user and session created successfully.');

  // Generate auth token
  const token = jwt.sign({ id: userId, sessionId: sessionId, name: 'Pro Tester' }, JWT_SECRET);

  // 3. Check Initial Pro status (should be false)
  console.log('\n🔍 Verifying initial standard tier status...');
  const initialProfileRes = await fetch(`http://localhost:${PORT}/api/user/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const initialProfile = await initialProfileRes.json();
  console.log(`👤 User profile: is_pro = ${initialProfile.is_pro}, plan = ${initialProfile.pro_plan}`);
  if (initialProfile.is_pro) {
    throw new Error('User should NOT be a Pro member initially');
  }

    // 4. Upgrade user to Pro (Annually plan)
    console.log('\n💳 Triggering Pro Upgrade checkout flow...');
    const referenceId = 'TXN_' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const upgradeRes = await fetch(`http://localhost:${PORT}/api/user/upgrade-pro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        plan: 'annually',
        referenceId: referenceId
      })
    });
    
    const upgradeData = await upgradeRes.json();
    console.log('📥 Upgrade response:', upgradeData);
    if (!upgradeData.success || !upgradeData.pending) {
      throw new Error('Upgrade request failed or did not set pending: ' + JSON.stringify(upgradeData));
    }

    // 5. Verify pending state in profile
    console.log('\n🔍 Verifying pending Pro status...');
    const pendingProfileRes = await fetch(`http://localhost:${PORT}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const pendingProfile = await pendingProfileRes.json();
    console.log(`👤 Updated profile: is_pro = ${pendingProfile.is_pro}, pro_status = ${pendingProfile.pro_status}, pending_ref = ${pendingProfile.pro_pending_ref}`);
    if (pendingProfile.is_pro) {
      throw new Error('User is_pro should not be true while payment is pending');
    }
    if (pendingProfile.pro_status !== 'pending') {
      throw new Error('User pro_status should be "pending"');
    }

    // 6. Simulate admin approval
    console.log('\n👑 Simulating admin approval action callback...');
    const approveToken = jwt.sign(
      { userId: userId, plan: 'annually', referenceId: referenceId, action: 'approve' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const verifyRes = await fetch(`http://localhost:${PORT}/api/admin/verify-upgrade?action=approve&token=${approveToken}`);
    const verifyHtml = await verifyRes.text();
    console.log('📥 Admin Callback Response (partial):', verifyHtml.slice(0, 300));
    if (!verifyHtml.includes('Subscription Approved')) {
      throw new Error('Admin verification approval HTML response mismatch');
    }

    // 7. Verify upgraded state in profile
    console.log('\n🔍 Verifying activated Pro status...');
    const finalProfileRes = await fetch(`http://localhost:${PORT}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const finalProfile = await finalProfileRes.json();
    console.log(`👤 Final profile: is_pro = ${finalProfile.is_pro}, pro_status = ${finalProfile.pro_status}, plan = ${finalProfile.pro_plan}`);
    console.log(`📅 Subscribed at: ${finalProfile.pro_subscribed_at}`);
    console.log(`📅 Expires at: ${finalProfile.pro_expires_at}`);

    if (!finalProfile.is_pro) {
      throw new Error('User is_pro should be true after admin approval');
    }
    if (finalProfile.pro_status !== 'active') {
      throw new Error('User pro_status should be "active" after admin approval');
    }
    if (finalProfile.pro_plan !== 'annually') {
      throw new Error('User pro_plan should be "annually"');
    }

    // Cleanup database records
    await query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM users WHERE id = $1`, [userId]);
    console.log('\n🧹 Test database records cleaned up.');

    console.log('🎉 ALL PRO MEMBERSHIP UPGRADE TESTS COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}
