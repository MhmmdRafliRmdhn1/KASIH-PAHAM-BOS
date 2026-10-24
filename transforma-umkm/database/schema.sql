-- ========================================================
-- TransformaUMKM — Relational Database Schema & Architecture
-- Dialect: PostgreSQL / MySQL Compatible
-- GTNIC 2026 Web Development Track
-- ========================================================

-- 1. Table: Categories
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: Suppliers
CREATE TABLE suppliers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone_whatsapp VARCHAR(20) NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: Products (Inventory)
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(36) REFERENCES categories(id) ON DELETE SET NULL,
    cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    sell_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    min_stock_threshold INT NOT NULL DEFAULT 5,
    supplier_id VARCHAR(36) REFERENCES suppliers(id) ON DELETE SET NULL,
    icon_emoji VARCHAR(20) DEFAULT '📦',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table: Customers (CRM)
CREATE TABLE customers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone_whatsapp VARCHAR(20) NOT NULL UNIQUE,
    total_spent DECIMAL(14, 2) DEFAULT 0.00,
    loyalty_points INT DEFAULT 0,
    segment VARCHAR(20) DEFAULT 'REGULAR', -- 'REGULAR', 'VIP', 'INACTIVE'
    notes TEXT,
    last_visit_at DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table: Transactions (Sales & Orders)
CREATE TABLE transactions (
    id VARCHAR(50) PRIMARY KEY, -- e.g. TRX-1001
    customer_id VARCHAR(36) REFERENCES customers(id) ON DELETE SET NULL,
    subtotal DECIMAL(14, 2) NOT NULL,
    discount_amount DECIMAL(14, 2) DEFAULT 0.00,
    tax_amount DECIMAL(14, 2) DEFAULT 0.00,
    grand_total DECIMAL(14, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL, -- 'QRIS', 'CASH', 'TRANSFER'
    cash_paid DECIMAL(14, 2) DEFAULT 0.00,
    cash_change DECIMAL(14, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'SELESAI',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table: Transaction Items
CREATE TABLE transaction_items (
    id VARCHAR(36) PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    unit_cost DECIMAL(12, 2) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal_price DECIMAL(14, 2) NOT NULL
);

-- 7. Table: Stock Mutation History (Audit Trail)
CREATE TABLE stock_mutations (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    mutation_type VARCHAR(20) NOT NULL, -- 'SALE', 'RESTOCK', 'ADJUSTMENT'
    qty_change INT NOT NULL,
    stock_after INT NOT NULL,
    reference_id VARCHAR(50), -- e.g. TRX-1001 or PO-2026-001
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_customers_phone ON customers(phone_whatsapp);
