require('dotenv').config();
const { query } = require('./src/db/index');

const API_BASE = 'http://localhost:3000/api';

async function runTests() {
  console.log('🚀 Starting E2E Integration and Validation Tests...\n');

  // Helper function to perform fetch requests
  async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
    const status = response.status;
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
    return { status, data };
  }

  // 1. Cleanup existing test accounts/data if any to ensure clean test state
  console.log('🧹 Cleaning up database test records...');
  await query("DELETE FROM group_members WHERE user_id IN (SELECT id FROM users WHERE email IN ($1, $2))", ['tester_student@nonstock.com', 'admin@tester.com']);
  await query("DELETE FROM contests WHERE hosted_by IN (SELECT id FROM users WHERE email IN ($1, $2))", ['tester_student@nonstock.com', 'admin@tester.com']);
  await query("DELETE FROM discussion_groups WHERE created_by IN (SELECT id FROM users WHERE email IN ($1, $2))", ['tester_student@nonstock.com', 'admin@tester.com']);
  await query("DELETE FROM users WHERE email IN ($1, $2)", ['tester_student@nonstock.com', 'admin@tester.com']);
  console.log('✅ Cleanup complete.\n');

  // 2. Register tester student
  console.log('👤 Registering student account (tester_student@nonstock.com)...');
  const studentReg = await apiRequest('/auth/register', 'POST', {
    email: 'tester_student@nonstock.com',
    password: 'Password123!',
    name: 'Student Tester'
  });
  if (studentReg.status !== 200) {
    throw new Error(`Student registration failed: ${JSON.stringify(studentReg.data)}`);
  }
  console.log('   Student registered successfully. Retrieving verification OTP from DB...');
  const studentOtpRes = await query("SELECT email_verify_token FROM users WHERE email = $1", ['tester_student@nonstock.com']);
  const studentOtp = studentOtpRes.rows[0].email_verify_token;
  console.log(`   OTP retrieved: ${studentOtp}. Verifying email...`);
  const studentVerify = await apiRequest('/auth/verify-email', 'POST', {
    email: 'tester_student@nonstock.com',
    otp: studentOtp
  });
  if (studentVerify.status !== 200) {
    throw new Error(`Student verification failed: ${JSON.stringify(studentVerify.data)}`);
  }
  
  console.log('   Logging in student...');
  const studentLogin = await apiRequest('/auth/login', 'POST', {
    email: 'tester_student@nonstock.com',
    password: 'Password123!'
  });
  if (studentLogin.status !== 200) {
    throw new Error(`Student login failed: ${JSON.stringify(studentLogin.data)}`);
  }
  const studentToken = studentLogin.data.token;
  console.log('✅ Student email verified and authenticated!\n');

  // 3. Register tester admin (starts with admin@)
  console.log('🔑 Registering admin account (admin@tester.com)...');
  const adminReg = await apiRequest('/auth/register', 'POST', {
    email: 'admin@tester.com',
    password: 'Password123!',
    name: 'Admin Tester'
  });
  if (adminReg.status !== 200) {
    throw new Error(`Admin registration failed: ${JSON.stringify(adminReg.data)}`);
  }
  console.log('   Admin registered successfully. Retrieving verification OTP from DB...');
  const adminOtpRes = await query("SELECT email_verify_token FROM users WHERE email = $1", ['admin@tester.com']);
  const adminOtp = adminOtpRes.rows[0].email_verify_token;
  console.log(`   OTP retrieved: ${adminOtp}. Verifying email...`);
  const adminVerify = await apiRequest('/auth/verify-email', 'POST', {
    email: 'admin@tester.com',
    otp: adminOtp
  });
  if (adminVerify.status !== 200) {
    throw new Error(`Admin verification failed: ${JSON.stringify(adminVerify.data)}`);
  }
  
  console.log('   Logging in admin...');
  const adminLogin = await apiRequest('/auth/login', 'POST', {
    email: 'admin@tester.com',
    password: 'Password123!'
  });
  if (adminLogin.status !== 200) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
  }
  const adminToken = adminLogin.data.token;
  console.log('✅ Admin email verified and authenticated!\n');

  // 4. Create Public Channel (Student)
  console.log('💬 Creating a new public channel...');
  const createGroup1 = await apiRequest('/community/groups', 'POST', {
    name: 'Student Public Hub',
    features: 'all-can-chat',
    isPublic: true,
    roomId: 'student_hub'
  }, studentToken);
  if (createGroup1.status !== 201) {
    throw new Error(`Group creation failed: ${JSON.stringify(createGroup1.data)}`);
  }
  console.log('✅ Public channel created successfully!');
  console.log('   Room Name: "Student Public Hub"');
  console.log('   Room ID/Handle: "@student_hub"\n');

  // 5. Verify Uniqueness Constraints
  console.log('⚠️ Verifying Room ID and Name uniqueness constraints...');
  
  // Try same Room ID, different Name
  console.log('   Trying to create group with duplicate Room ID ("student_hub")...');
  const dupRoomIdRes = await apiRequest('/community/groups', 'POST', {
    name: 'Different Name But Same ID',
    features: 'all-can-chat',
    isPublic: true,
    roomId: 'student_hub'
  }, studentToken);
  if (dupRoomIdRes.status === 400) {
    console.log(`   ✅ Correctly blocked duplicate Room ID creation. Server response: "${dupRoomIdRes.data.error}"`);
  } else {
    throw new Error(`Failed to block duplicate Room ID. Status code: ${dupRoomIdRes.status}`);
  }

  // Try same Name, different Room ID
  console.log('   Trying to create group with duplicate Room Name ("Student Public Hub")...');
  const dupNameRes = await apiRequest('/community/groups', 'POST', {
    name: 'Student Public Hub',
    features: 'all-can-chat',
    isPublic: true,
    roomId: 'student_hub_new'
  }, studentToken);
  if (dupNameRes.status === 400) {
    console.log(`   ✅ Correctly blocked duplicate Room Name creation. Server response: "${dupNameRes.data.error}"`);
  } else {
    throw new Error(`Failed to block duplicate Room Name. Status code: ${dupNameRes.status}`);
  }
  console.log('');

  // 6. Search Discovery
  console.log('🔍 Testing search discovery for public rooms...');
  const searchRes = await apiRequest('/community/groups/search?q=student', 'GET', null, studentToken);
  if (searchRes.status !== 200 || !Array.isArray(searchRes.data)) {
    throw new Error(`Search failed: ${JSON.stringify(searchRes.data)}`);
  }
  const foundGroup = searchRes.data.find(g => g.room_id === 'student_hub');
  if (foundGroup) {
    console.log(`   ✅ Success! Found public channel "${foundGroup.name}" with room_id "@${foundGroup.room_id}" via search.`);
  } else {
    throw new Error('Created public channel not returned in search results');
  }
  console.log('');

  // 7. Request to Host a Contest (Student)
  console.log('🏆 Submitting request to Host a Contest...');
  const contestRequest = await apiRequest('/community/contests', 'POST', {
    title: 'Option Strategy Face-Off (Automated Test)',
    description: 'A contest testing option strategy configurations and real-time execution.',
    prizePool: '₹50,000 Cash Pool',
    startDate: '2026-08-01',
    endDate: '2026-08-10',
    proofs: 'Verified Option Educator on NSE, registered certificate ID: 890123.'
  }, studentToken);
  if (contestRequest.status !== 201) {
    throw new Error(`Contest request submission failed: ${JSON.stringify(contestRequest.data)}`);
  }
  console.log(`   ✅ Contest request submitted successfully. Status: ${contestRequest.data.message}\n`);

  // 8. Admin Approval Workflow
  console.log('👑 Testing admin approval workflow...');
  
  // Fetch pending contests as Admin
  console.log('   Fetching pending contest requests as Admin...');
  const pendingContests = await apiRequest('/community/contests/pending', 'GET', null, adminToken);
  if (pendingContests.status !== 200) {
    throw new Error(`Fetch pending contests failed: ${JSON.stringify(pendingContests.data)}`);
  }
  const myPendingContest = pendingContests.data.find(c => c.title.includes('Option Strategy Face-Off'));
  if (!myPendingContest) {
    throw new Error('Submitted contest not found in admin pending list');
  }
  console.log(`   ✅ Found pending contest "${myPendingContest.title}" with proofs: "${myPendingContest.proofs}".`);

  // Approve the contest
  console.log(`   Approving contest ID: ${myPendingContest.id}...`);
  const approveRes = await apiRequest(`/community/contests/${myPendingContest.id}/approve`, 'POST', null, adminToken);
  if (approveRes.status !== 200) {
    throw new Error(`Failed to approve contest: ${JSON.stringify(approveRes.data)}`);
  }
  console.log(`   ✅ Contest approved successfully! Response message: "${approveRes.data.message}"\n`);

  // 9. Participate / Verify Joined
  console.log('📊 Verifying that contest is active and student can join/participate...');
  const contestsList = await apiRequest('/community/contests', 'GET', null, studentToken);
  if (contestsList.status !== 200) {
    throw new Error(`Failed to fetch active contests: ${JSON.stringify(contestsList.data)}`);
  }
  const approvedContest = contestsList.data.find(c => c.id === myPendingContest.id);
  if (approvedContest && approvedContest.status === 'approved') {
    console.log(`   ✅ Verified contest is active with status: "${approvedContest.status}".`);
  } else {
    throw new Error('Approved contest not listed as active/approved in public contests list');
  }

  // Join the contest
  console.log(`   Joining contest ID: ${approvedContest.id} as student...`);
  const joinContestRes = await apiRequest(`/community/contests/${approvedContest.id}/join`, 'POST', null, studentToken);
  if (joinContestRes.status !== 200) {
    throw new Error(`Failed to join contest: ${JSON.stringify(joinContestRes.data)}`);
  }
  console.log('   ✅ Successfully joined/participated in the contest!\n');

  console.log('🎉 All E2E Integration and Validation Tests Passed Successfully!');
}

runTests().catch(err => {
  console.error('\n❌ E2E Integration and Validation Tests Failed:', err);
  process.exit(1);
});
