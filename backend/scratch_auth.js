require('dotenv').config();
const { query } = require('./src/db/index');

const API_BASE = 'https://nonstock.onrender.com/api';

async function main() {
  const email = 'tester_browser_antigravity@nonstock.com';
  const password = 'Password123!';
  const name = 'Antigravity Tester';

  console.log('Cleaning up existing tester user...');
  await query("DELETE FROM users WHERE email = $1", [email]);

  console.log('Registering user...');
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });

  if (!regRes.ok) {
    const text = await regRes.text();
    console.error('Registration failed:', text);
    return;
  }

  console.log('Retrieving verification OTP from DB...');
  const otpRes = await query("SELECT email_verify_token FROM users WHERE email = $1", [email]);
  const otp = otpRes.rows[0].email_verify_token;
  console.log('OTP:', otp);

  console.log('Verifying email...');
  const verifyRes = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });

  if (!verifyRes.ok) {
    const text = await verifyRes.text();
    console.error('Verification failed:', text);
    return;
  }

  console.log('Logging in...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!loginRes.ok) {
    const text = await loginRes.text();
    console.error('Login failed:', text);
    return;
  }

  const loginData = await loginRes.json();
  console.log('SUCCESS! JWT TOKEN IS:');
  console.log(loginData.token);
}

main().catch(console.error);
