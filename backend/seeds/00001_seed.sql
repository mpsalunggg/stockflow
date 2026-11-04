-- +goose Up
INSERT INTO products (sku, name, price, stock, is_active) VALUES
    ('BRS-PRM-5KG',  'Beras Premium 5 kg',            78000,  42, TRUE),
    ('MNY-GRG-2L',   'Minyak Goreng 2 L',             36500,  60, TRUE),
    ('GLA-PSR-1KG',  'Gula Pasir 1 kg',               17500,  85, TRUE),
    ('TPG-TRG-1KG',  'Tepung Terigu 1 kg',            13000,   8, TRUE),
    ('TLR-AYM-30',   'Telur Ayam 1 Tray (30 butir)',  58000,  15, TRUE),
    ('KPI-BUB-200G', 'Kopi Bubuk 200 g',              24000,  33, TRUE),
    ('TEH-CLP-25',   'Teh Celup isi 25',               9500, 120, TRUE),
    ('SUS-UHT-1L',   'Susu UHT Full Cream 1 L',       19500,   6, TRUE),
    ('MIE-INS-40',   'Mie Instan Goreng (dus 40)',   115000,  20, TRUE),
    ('AIR-MNR-600',  'Air Mineral 600 ml (dus 24)',   48000,  50, TRUE),
    ('SBN-CUC-800',  'Sabun Cuci Piring 800 ml',      16000,  27, TRUE),
    ('DTR-BUB-1KG',  'Deterjen Bubuk 1 kg',           25500,   4, TRUE),
    ('KCP-MNS-600',  'Kecap Manis 600 ml',            21000,  18, TRUE),
    ('SRP-MPL-500',  'Sirup Melon 500 ml',            14500,   0, FALSE)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO sales_orders (id, customer, status, total, created_at) VALUES
    (1, 'Toko Sumber Rejeki', 'CREATED', 270000, now() - interval '1 day'),
    (2, 'Warung Bu Sari',     'CREATED', 160000, now() - interval '3 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sales_order_items (order_id, sku, qty, unit_price)
SELECT v.order_id, v.sku, v.qty, v.unit_price
FROM (VALUES
    (1, 'BRS-PRM-5KG', 2, 78000),
    (1, 'MNY-GRG-2L',  2, 36500),
    (1, 'GLA-PSR-1KG', 2, 17500),
    (2, 'MIE-INS-40',  1, 115000),
    (2, 'TEH-CLP-25',  2, 9500),
    (2, 'KCP-MNS-600', 1, 21000)
) AS v(order_id, sku, qty, unit_price)
WHERE NOT EXISTS (SELECT 1 FROM sales_order_items i WHERE i.order_id = v.order_id);

SELECT setval(pg_get_serial_sequence('sales_orders', 'id'), (SELECT max(id) FROM sales_orders));

-- +goose Down
DELETE FROM sales_order_items WHERE order_id IN (1, 2);
DELETE FROM sales_orders WHERE id IN (1, 2);
DELETE FROM products WHERE sku IN (
    'BRS-PRM-5KG', 'MNY-GRG-2L', 'GLA-PSR-1KG', 'TPG-TRG-1KG', 'TLR-AYM-30',
    'KPI-BUB-200G', 'TEH-CLP-25', 'SUS-UHT-1L', 'MIE-INS-40', 'AIR-MNR-600',
    'SBN-CUC-800', 'DTR-BUB-1KG', 'KCP-MNS-600', 'SRP-MPL-500'
);
