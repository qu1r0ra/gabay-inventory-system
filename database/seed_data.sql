-- Seed Data for Gabay Inventory System
-- Initial/test data for development and edge function testing

-- Clear existing data (for development only)
TRUNCATE TABLE corrections CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE item_stocks CASCADE;
TRUNCATE TABLE items CASCADE;
TRUNCATE TABLE notifications CASCADE;

-- Insert Items
INSERT INTO items (name) VALUES
  ('Bandage'),
  ('Alcohol Wipes'),
  ('Gauze Pads'),
  ('Antibiotic Ointment'),
  ('Surgical Gloves'),
  ('Thermometer'),
  ('Face Masks'),
  ('Scissors'),
  ('Cotton Balls'),
  ('Eye Drops'),
  ('Burn Cream'),
  ('Medical Tape'),
  ('Syringes'),
  ('Pain Relievers'),
  ('First Aid Kit');

-- Insert Item Stocks with various scenarios for testing edge functions
-- Using subqueries to get the actual item UUIDs and generate lot UUIDs
INSERT INTO item_stocks (item_id, item_qty, expiry_date, lot_id) 
SELECT id, 120, '2025-08-01'::timestamp with time zone, gen_random_uuid() FROM items WHERE name = 'Bandage'
UNION ALL
SELECT id, 80, '2025-08-15'::timestamp with time zone, gen_random_uuid() FROM items WHERE name = 'Alcohol Wipes'
UNION ALL
SELECT id, 50, '2025-07-25'::timestamp with time zone, gen_random_uuid() FROM items WHERE name = 'Gauze Pads'
UNION ALL
SELECT id, 70, '2025-08-10'::timestamp with time zone, gen_random_uuid() FROM items WHERE name = 'Antibiotic Ointment'
UNION ALL
SELECT id, 200, '2025-07-30'::timestamp with time zone, gen_random_uuid() FROM items WHERE name = 'Surgical Gloves'
UNION ALL
SELECT id, 5, '2026-03-15'::timestamp with time zone, gen_random_uuid() FROM items WHERE name = 'Thermometer'
UNION ALL
SELECT id, 500, '2026-06-30'::timestamp with time zone, gen_random_uuid() FROM items WHERE name = 'Face Masks'
UNION ALL
SELECT id, 3, NULL, gen_random_uuid() FROM items WHERE name = 'Scissors'
UNION ALL
SELECT id, 150, '2025-10-05'::timestamp with time zone, gen_random_uuid() FROM items WHERE name = 'Cotton Balls'
UNION ALL
SELECT id, 8, '2025-08-05'::timestamp with time zone, gen_random_uuid() FROM items WHERE name = 'Eye Drops'
UNION ALL
SELECT id, 7, '2025-07-28'::timestamp with time zone, gen_random_uuid() FROM items WHERE name = 'Burn Cream'
UNION ALL
SELECT id, 110, '2026-04-01'::timestamp with time zone, gen_random_uuid() FROM items WHERE name = 'Medical Tape'
UNION ALL
SELECT id, 25, '2025-12-31'::timestamp with time zone, gen_random_uuid() FROM items WHERE name = 'Syringes'
UNION ALL
SELECT id, 45, NULL, gen_random_uuid() FROM items WHERE name = 'Pain Relievers'
UNION ALL
SELECT id, 12, '2026-01-15'::timestamp with time zone, gen_random_uuid() FROM items WHERE name = 'First Aid Kit';

-- Insert a test user (you'll need to replace with a real user ID from your auth.users table)
-- INSERT INTO users (id, email, name, is_admin) VALUES 
--   ('test-user-id', 'admin@gabay.com', 'Admin User', true);

-- Insert sample transactions for testing transaction history
-- Using subqueries to get actual lot_ids from item_stocks and user UUIDs from auth.users
INSERT INTO transactions (lot_id, user_id, item_qty_change, type)
-- Admin user transactions
SELECT lot_id, (SELECT id FROM auth.users WHERE email = 'admin@gabay.org'), 50, 'DEPOSIT'::transaction_type 
FROM item_stocks 
WHERE item_id = (SELECT id FROM items WHERE name = 'Bandage')
UNION ALL
SELECT lot_id, (SELECT id FROM auth.users WHERE email = 'admin@gabay.org'), -2, 'DISTRIBUTE'::transaction_type 
FROM item_stocks 
WHERE item_id = (SELECT id FROM items WHERE name = 'Thermometer')
UNION ALL
SELECT lot_id, (SELECT id FROM auth.users WHERE email = 'admin@gabay.org'), 100, 'DEPOSIT'::transaction_type 
FROM item_stocks 
WHERE item_id = (SELECT id FROM items WHERE name = 'Face Masks')
UNION ALL
SELECT lot_id, (SELECT id FROM auth.users WHERE email = 'admin@gabay.org'), -5, 'DISTRIBUTE'::transaction_type 
FROM item_stocks 
WHERE item_id = (SELECT id FROM items WHERE name = 'Surgical Gloves')
UNION ALL
SELECT lot_id, (SELECT id FROM auth.users WHERE email = 'admin@gabay.org'), 25, 'DEPOSIT'::transaction_type 
FROM item_stocks 
WHERE item_id = (SELECT id FROM items WHERE name = 'Antibiotic Ointment')
UNION ALL
-- Non-admin user transactions
SELECT lot_id, (SELECT id FROM auth.users WHERE email = 'not-admin@gabay.org'), -3, 'DISTRIBUTE'::transaction_type 
FROM item_stocks 
WHERE item_id = (SELECT id FROM items WHERE name = 'Gauze Pads')
UNION ALL
SELECT lot_id, (SELECT id FROM auth.users WHERE email = 'not-admin@gabay.org'), 15, 'DEPOSIT'::transaction_type 
FROM item_stocks 
WHERE item_id = (SELECT id FROM items WHERE name = 'Cotton Balls')
UNION ALL
SELECT lot_id, (SELECT id FROM auth.users WHERE email = 'not-admin@gabay.org'), -1, 'DISTRIBUTE'::transaction_type 
FROM item_stocks 
WHERE item_id = (SELECT id FROM items WHERE name = 'Eye Drops')
UNION ALL
SELECT lot_id, (SELECT id FROM auth.users WHERE email = 'not-admin@gabay.org'), -2, 'DISTRIBUTE'::transaction_type 
FROM item_stocks 
WHERE item_id = (SELECT id FROM items WHERE name = 'Burn Cream')
UNION ALL
SELECT lot_id, (SELECT id FROM auth.users WHERE email = 'not-admin@gabay.org'), 30, 'DEPOSIT'::transaction_type 
FROM item_stocks 
WHERE item_id = (SELECT id FROM items WHERE name = 'Medical Tape');

-- Summary of test data:
-- Total Items: 15
-- Expiring Soon (≤30 days): 5 items (Bandage, Gauze Pads, Surgical Gloves, Eye Drops, Burn Cream)
-- Low Stock (≤10): 5 items (Thermometer, Scissors, Eye Drops, Burn Cream, First Aid Kit)
-- Both Expiring + Low Stock: 2 items (Eye Drops, Burn Cream)
-- No Expiry Date: 2 items (Scissors, Pain Relievers)
-- Normal Stock: 8 items (Alcohol Wipes, Antibiotic Ointment, Face Masks, Cotton Balls, Medical Tape, Syringes, Pain Relievers, First Aid Kit)
-- Total Transactions: 10 (5 admin + 5 non-admin user)
-- Transaction Types: DEPOSIT (6), DISTRIBUTE (4)
-- Users: admin@gabay.org (5 transactions), not-admin@gabay.org (5 transactions)
