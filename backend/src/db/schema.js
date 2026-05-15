const { query } = require('./index');

async function createTables() {
  console.log('Creating database tables...');
  
  // Users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      is_email_verified BOOLEAN DEFAULT FALSE,
      email_verify_token VARCHAR(255),
      email_verify_expiry TIMESTAMP,
      two_factor_secret VARCHAR(255),
      two_factor_enabled BOOLEAN DEFAULT FALSE,
      theme VARCHAR(50) DEFAULT 'dark',
      language VARCHAR(10) DEFAULT 'en',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sessions table
  await query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      device_name VARCHAR(255),
      is_valid BOOLEAN DEFAULT TRUE,
      last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    )
  `);

  // Login attempts table (for rate limiting)
  await query(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      ip_address VARCHAR(45),
      success BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Portfolio table
  await query(`
    CREATE TABLE IF NOT EXISTS portfolio_items (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      symbol VARCHAR(50) NOT NULL,
      quantity DECIMAL(15, 4) NOT NULL,
      buy_price DECIMAL(15, 4) NOT NULL,
      buy_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      current_price DECIMAL(15, 4),
      UNIQUE(user_id, symbol)
    )
  `);

  // Watchlist table
  await query(`
    CREATE TABLE IF NOT EXISTS watchlist_items (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      symbol VARCHAR(50) NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, symbol)
    )
  `);

  // Price alerts table
  await query(`
    CREATE TABLE IF NOT EXISTS price_alerts (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      symbol VARCHAR(50) NOT NULL,
      target_price DECIMAL(15, 4) NOT NULL,
      condition VARCHAR(10) CHECK (condition IN ('above', 'below')),
      is_triggered BOOLEAN DEFAULT FALSE,
      triggered_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ All tables created successfully');
}

module.exports = { createTables };