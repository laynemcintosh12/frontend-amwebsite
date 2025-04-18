-- =========================
-- USERS TABLE
-- =========================
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,        -- e.g., 'affiliate', 'salesman', 'sales manager', 'supplementer', 'admin'
    permissions VARCHAR(50) NOT NULL, -- separate from role (allows for dual permissions e.g. developer privileges)
    hire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
ADD COLUMN reset_password_token VARCHAR(255),
ADD COLUMN reset_password_expires TIMESTAMP;

-- Add a column for monthly_goal to the users table
ALTER TABLE users
ADD COLUMN monthly_goal NUMERIC(12,2) DEFAULT 50000.00; -- Default value set to 50,000

-- change monthly goal column to yearly_goal
ALTER TABLE users
RENAME COLUMN monthly_goal TO yearly_goal;

-- =========================
-- CUSTOMERS TABLE
-- =========================
DROP TABLE IF EXISTS customers CASCADE;
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(50),
    salesman_id INTEGER REFERENCES users(id),    -- references a salesman in the users table
    supplementer_id INTEGER REFERENCES users(id),  -- references a supplementer in the users table
    manager_id INTEGER REFERENCES users(id),       -- references a sales manager in the users table
    supplement_manager_id INTEGER REFERENCES users(id),  -- references a supplement manager in the users table
    status VARCHAR(100),
    initial_scope_price NUMERIC(12,2),
    total_job_price NUMERIC(12,2),
    lead_source VARCHAR(255),
    referrer_id INTEGER REFERENCES users(id),      -- references an affiliate marketer (user)
    last_updated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE customers ADD CONSTRAINT unique_customer_name UNIQUE (customer_name);

-- Add build_date to customers table
ALTER TABLE customers
ADD COLUMN build_date TIMESTAMP;

-- =========================
-- COMMISSIONS DUE TABLE
-- =========================
-- This table stores the commission amounts calculated for each user/customer,
-- representing the commissions that should be paid.
DROP TABLE IF EXISTS commissions_due CASCADE;
CREATE TABLE commissions_due (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    commission_amount NUMERIC(12,2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE, -- toggles once payment is made; remains false until paid
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add a unique constraint to the commissions_due table
ALTER TABLE commissions_due
ADD CONSTRAINT unique_user_customer UNIQUE (user_id, customer_id);

-- Add build_date to commissions_due table
ALTER TABLE commissions_due
ADD COLUMN build_date TIMESTAMP;

-- Add updated_at to commissions_due table
ALTER TABLE commissions_due
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- =========================
-- COMMISSION PAYMENTS TABLE
-- =========================
-- This table logs the actual payments made to users. Each record is associated
-- with a commission due entry. You might display these fields similarly to how you show commission dues.
DROP TABLE IF EXISTS commission_payments CASCADE;
CREATE TABLE commission_payments (
    id SERIAL PRIMARY KEY,
    commission_due_id INTEGER NOT NULL REFERENCES commissions_due(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    commission_amount NUMERIC(12,2) NOT NULL,
    check_number VARCHAR(100),
    paid_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TEAMS TABLE
-- =========================
DROP TABLE IF EXISTS teams CASCADE;
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Sales Manager or Supplement Manager
    salesman_ids INTEGER[] DEFAULT '{}', -- Array of salesman IDs
    supplementer_ids INTEGER[] DEFAULT '{}', -- Array of supplementer IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
