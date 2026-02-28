-- Migração: Adicionar colunas de billing Stripe no tenant
-- Data: 2026-02-27

-- stripe_customer_id
SET @__col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tenants'
    AND COLUMN_NAME = 'stripe_customer_id'
);
SET @__sql := IF(
  @__col_exists = 0,
  'ALTER TABLE tenants ADD COLUMN stripe_customer_id VARCHAR(255) NULL AFTER logo',
  'SELECT 1'
);
PREPARE __stmt FROM @__sql; EXECUTE __stmt; DEALLOCATE PREPARE __stmt;

-- stripe_subscription_id
SET @__col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tenants'
    AND COLUMN_NAME = 'stripe_subscription_id'
);
SET @__sql := IF(
  @__col_exists = 0,
  'ALTER TABLE tenants ADD COLUMN stripe_subscription_id VARCHAR(255) NULL AFTER stripe_customer_id',
  'SELECT 1'
);
PREPARE __stmt FROM @__sql; EXECUTE __stmt; DEALLOCATE PREPARE __stmt;

-- stripe_price_id
SET @__col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tenants'
    AND COLUMN_NAME = 'stripe_price_id'
);
SET @__sql := IF(
  @__col_exists = 0,
  'ALTER TABLE tenants ADD COLUMN stripe_price_id VARCHAR(255) NULL AFTER stripe_subscription_id',
  'SELECT 1'
);
PREPARE __stmt FROM @__sql; EXECUTE __stmt; DEALLOCATE PREPARE __stmt;

-- stripe_checkout_session_id
SET @__col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tenants'
    AND COLUMN_NAME = 'stripe_checkout_session_id'
);
SET @__sql := IF(
  @__col_exists = 0,
  'ALTER TABLE tenants ADD COLUMN stripe_checkout_session_id VARCHAR(255) NULL AFTER stripe_price_id',
  'SELECT 1'
);
PREPARE __stmt FROM @__sql; EXECUTE __stmt; DEALLOCATE PREPARE __stmt;

-- subscription_status
SET @__col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tenants'
    AND COLUMN_NAME = 'subscription_status'
);
SET @__sql := IF(
  @__col_exists = 0,
  'ALTER TABLE tenants ADD COLUMN subscription_status VARCHAR(50) NULL AFTER stripe_checkout_session_id',
  'SELECT 1'
);
PREPARE __stmt FROM @__sql; EXECUTE __stmt; DEALLOCATE PREPARE __stmt;

-- subscription_current_period_end
SET @__col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tenants'
    AND COLUMN_NAME = 'subscription_current_period_end'
);
SET @__sql := IF(
  @__col_exists = 0,
  'ALTER TABLE tenants ADD COLUMN subscription_current_period_end TIMESTAMP NULL AFTER subscription_status',
  'SELECT 1'
);
PREPARE __stmt FROM @__sql; EXECUTE __stmt; DEALLOCATE PREPARE __stmt;

SELECT 'Migração Stripe billing aplicada com sucesso!' AS status;

