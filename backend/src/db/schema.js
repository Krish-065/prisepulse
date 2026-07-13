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
      email_verify_expiry TIMESTAMPTZ,
      two_factor_secret VARCHAR(255),
      two_factor_enabled BOOLEAN DEFAULT FALSE,
      theme VARCHAR(50) DEFAULT 'dark',
      language VARCHAR(10) DEFAULT 'en',
      base_currency VARCHAR(10) DEFAULT 'INR',
      refresh_rate VARCHAR(10) DEFAULT '15s',
      landing_page VARCHAR(50) DEFAULT 'Dashboard',
      broker_code VARCHAR(50) DEFAULT 'PRP065',
      demat_id VARCHAR(50) DEFAULT '1208160001094852',
      dp_name VARCHAR(100) DEFAULT 'NonStock Securities Pvt Ltd',
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
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS dp_name VARCHAR(100) DEFAULT 'NonStock Securities Pvt Ltd'`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_id VARCHAR(50) DEFAULT 'ABCDE*****F'`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS brokerage_plan VARCHAR(100) DEFAULT '₹0 Equity Delivery / ₹20 F&O Intraday'`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS connected_broker VARCHAR(100)`);

  // Migrate existing column type to TIMESTAMPTZ
  try {
    await query(`ALTER TABLE users ALTER COLUMN email_verify_expiry TYPE TIMESTAMPTZ`);
  } catch (err) {
    console.warn('Migration warning (email_verify_expiry):', err.message);
  }

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

  // Add virtual_balance column to users table
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS virtual_balance DECIMAL(15,2) DEFAULT 1000000.00`);

  // Create paper_portfolio_items table
  await query(`
    CREATE TABLE IF NOT EXISTS paper_portfolio_items (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      symbol VARCHAR(50) NOT NULL,
      quantity DECIMAL(15,4) NOT NULL,
      buy_price DECIMAL(15,4) NOT NULL,
      buy_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, symbol)
    )
  `);

  // Create paper_trades table
  await query(`
    CREATE TABLE IF NOT EXISTS paper_trades (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      symbol VARCHAR(50) NOT NULL,
      action VARCHAR(10) NOT NULL,
      quantity DECIMAL(15,4) NOT NULL,
      price DECIMAL(15,4) NOT NULL,
      pnl DECIMAL(15,4),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create saved_strategies table
  await query(`
    CREATE TABLE IF NOT EXISTS saved_strategies (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      indicators TEXT NOT NULL,
      stop_loss DECIMAL(5,2),
      take_profit DECIMAL(5,2),
      capital DECIMAL(15,2),
      risk_percent DECIMAL(5,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create shared_strategies table
  await query(`
    CREATE TABLE IF NOT EXISTS shared_strategies (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      strategy_name VARCHAR(255) NOT NULL,
      indicators TEXT NOT NULL,
      win_rate DECIMAL(5,2),
      net_profit DECIMAL(10,2),
      drawdown DECIMAL(5,2),
      copied_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Alterations for price_alerts to support indicators/crossovers
  await query(`ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS alert_type VARCHAR(50) DEFAULT 'price'`);
  await query(`ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS delivery_methods VARCHAR(100) DEFAULT 'email'`);
  try {
    await query(`ALTER TABLE price_alerts ALTER COLUMN target_price DROP NOT NULL`);
  } catch (err) {
    console.warn('Migration warning (target_price nullable):', err.message);
  }

  // Update price_alerts constraint to support crossovers
  try {
    await query(`ALTER TABLE price_alerts DROP CONSTRAINT IF EXISTS price_alerts_condition_check`);
  } catch (err) {
    console.warn('Migration warning (drop constraint):', err.message);
  }
  try {
    await query(`ALTER TABLE price_alerts ADD CONSTRAINT price_alerts_condition_check CHECK (condition IN ('above', 'below', 'crosses'))`);
  } catch (err) {
    console.warn('Migration warning (add constraint):', err.message);
  }

  // Add missing fields utilized in backend/src/api/alerts.js
  await query(`ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`);
  await query(`ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'in-app'`);
  await query(`ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(50) DEFAULT 'price'`);
  await query(`ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS indicator_period INTEGER DEFAULT 14`);


  // Create community_posts table
  await query(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create courses table
  await query(`
    CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      instructor VARCHAR(255) NOT NULL,
      youtube_link VARCHAR(255) NOT NULL,
      category VARCHAR(100) DEFAULT 'General',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create contests table
  await query(`
    CREATE TABLE IF NOT EXISTS contests (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      prize_pool VARCHAR(255) NOT NULL,
      start_date VARCHAR(100) NOT NULL,
      end_date VARCHAR(100) NOT NULL,
      participants INTEGER DEFAULT 0
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS discussion_groups (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
      features VARCHAR(50) DEFAULT 'all-can-chat',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS group_members (
      id VARCHAR(255) PRIMARY KEY,
      group_id VARCHAR(255) REFERENCES discussion_groups(id) ON DELETE CASCADE,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(group_id, user_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS group_invitations (
      id VARCHAR(255) PRIMARY KEY,
      group_id VARCHAR(255) REFERENCES discussion_groups(id) ON DELETE CASCADE,
      invited_by VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(group_id, email, status)
    )
  `);

  // Seed default discussion groups if empty
  const groupCount = await query('SELECT COUNT(*) FROM discussion_groups');
  if (parseInt(groupCount.rows[0].count) === 0) {
    console.log('Seeding default public discussion groups...');
    const defaultGroups = [
      ['nifty', 'Nifty & BankNifty Tips', null, 'all-can-chat'],
      ['options', 'F&O Strategies', null, 'all-can-chat'],
      ['basics', 'Basics for Beginners', null, 'all-can-chat'],
      ['crypto', 'Crypto Wizards', null, 'all-can-chat']
    ];
    for (const g of defaultGroups) {
      await query('INSERT INTO discussion_groups (id, name, created_by, features) VALUES ($1,$2,$3,$4)', g);
    }
  }

  // Create group_messages table
  await query(`
    CREATE TABLE IF NOT EXISTS group_messages (
      id VARCHAR(255) PRIMARY KEY,
      group_id VARCHAR(255) REFERENCES discussion_groups(id) ON DELETE CASCADE,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      author_name VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default courses if empty
  const courseCount = await query('SELECT COUNT(*) FROM courses');
  if (parseInt(courseCount.rows[0].count) === 0) {
    console.log('Seeding default educational courses...');
    const defaultCourses = [
      ['c1', 'Stock Investing 101 for Beginners', 'Learn the basics of stock market, how shares work, and your first steps in investing.', 'PrisePulse Academy', 'https://www.youtube.com/watch?v=Xn7KWR97DQA', 'Basics'],
      ['c2', 'Mastering RSI & EMA Technical Indicators', 'In-depth guide to technical indicators, standard parameters, and setups.', 'QuantPro Teacher', 'https://www.youtube.com/watch?v=fn24_D3L4z8', 'Technicals'],
      ['c3', 'Introduction to Futures & Options (F&O)', 'Learn option chains, Open Interest, Call-Put ratios, and contract definitions.', 'OptionGeek YouTuber', 'https://www.youtube.com/watch?v=1u4bWvjFpxM', 'F&O'],
      ['c4', 'Building & Backtesting Algorithmic Strategies', 'Step-by-step walkthrough on creating risk-managed backtest systems.', 'NonStock AI Mentor', 'https://www.youtube.com/watch?v=8mG_E15_l_0', 'Algorithms']
    ];
    for (const c of defaultCourses) {
      await query('INSERT INTO courses (id, title, description, instructor, youtube_link, category) VALUES ($1,$2,$3,$4,$5,$6)', c);
    }
  }

  // Seed default contests if empty
  const contestCount = await query('SELECT COUNT(*) FROM contests');
  if (parseInt(contestCount.rows[0].count) === 0) {
    console.log('Seeding default trading contests...');
    const defaultContests = [
      ['ct1', 'Monthly Paper Trading Championship', 'Trade virtual ₹10,00,000. Top 3 gainers win exclusive rewards.', '₹10,000 Cash Voucher Pool', '1st July 2026', '31st July 2026', 156],
      ['ct2', 'RSI Scalping Strategy Challenge', 'Build and run backtests. Highest win rate strategy wins.', '₹5,000 Amazon Gift Cards', '15th July 2026', '20th July 2026', 82]
    ];
    for (const ct of defaultContests) {
      await query('INSERT INTO contests (id, title, description, prize_pool, start_date, end_date, participants) VALUES ($1,$2,$3,$4,$5,$6,$7)', ct);
    }
  }

  console.log('✅ All tables created');
}

module.exports = { createTables };