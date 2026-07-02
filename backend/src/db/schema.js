const { query } = require('./index');

async function createTables() {
  console.log('Creating database tables...');

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
      base_currency VARCHAR(10) DEFAULT 'INR',
      refresh_rate VARCHAR(10) DEFAULT '15s',
      landing_page VARCHAR(50) DEFAULT 'Dashboard',
      broker_code VARCHAR(50) DEFAULT 'PRP065',
      demat_id VARCHAR(50) DEFAULT '1208160001094852',
      dp_name VARCHAR(100) DEFAULT 'PricePulse Securities Pvt Ltd',
      pan_id VARCHAR(50) DEFAULT 'ABCDE*****F',
      brokerage_plan VARCHAR(100) DEFAULT '₹0 Equity Delivery / ₹20 F&O Intraday',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ensure these columns exist for existing databases
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS base_currency VARCHAR(10) DEFAULT 'INR'`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_rate VARCHAR(10) DEFAULT '15s'`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS landing_page VARCHAR(50) DEFAULT 'Dashboard'`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS broker_code VARCHAR(50) DEFAULT 'PRP065'`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS demat_id VARCHAR(50) DEFAULT '1208160001094852'`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS dp_name VARCHAR(100) DEFAULT 'PricePulse Securities Pvt Ltd'`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_id VARCHAR(50) DEFAULT 'ABCDE*****F'`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS brokerage_plan VARCHAR(100) DEFAULT '₹0 Equity Delivery / ₹20 F&O Intraday'`);

  await query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      is_valid BOOLEAN DEFAULT TRUE,
      last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      ip_address VARCHAR(45),
      success BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS portfolio_items (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      symbol VARCHAR(50) NOT NULL,
      quantity DECIMAL(15,4) NOT NULL,
      buy_price DECIMAL(15,4) NOT NULL,
      buy_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, symbol)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS watchlist_items (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      symbol VARCHAR(50) NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, symbol)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS price_alerts (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      symbol VARCHAR(50) NOT NULL,
      target_price DECIMAL(15,4) NOT NULL,
      condition VARCHAR(10) CHECK (condition IN ('above','below')),
      is_triggered BOOLEAN DEFAULT FALSE,
      triggered_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ All tables created');
}

module.exports = { createTables };