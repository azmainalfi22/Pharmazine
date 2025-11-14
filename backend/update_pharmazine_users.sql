-- Delete existing pharmazine users if they exist
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM profiles WHERE email LIKE '%@pharmazine.com');
DELETE FROM profiles WHERE email LIKE '%@pharmazine.com';

-- Create Admin user
INSERT INTO profiles (id, full_name, email, password_hash, phone, created_at, updated_at)
VALUES (
    'admin-pharmazine-001',
    'Admin User',
    'admin@pharmazine.com',
    '$2b$12$vQe4b6tJV4AM9X3yjf6zleHJWBIGOZQQytIX7vR3BjqHeOETH3AIC',
    NULL,
    NOW(),
    NOW()
);

INSERT INTO user_roles (id, user_id, role, created_at)
VALUES ('admin-role-001', 'admin-pharmazine-001', 'admin', NOW());

-- Create Manager user
INSERT INTO profiles (id, full_name, email, password_hash, phone, created_at, updated_at)
VALUES (
    'manager-pharmazine-001',
    'Manager User',
    'manager@pharmazine.com',
    '$2b$12$s7Ij4XM6EkEE3ql5P/7Ere9l.mLKvI/B4Ndt5OJTNwRAkFgXpn9Gq',
    NULL,
    NOW(),
    NOW()
);

INSERT INTO user_roles (id, user_id, role, created_at)
VALUES ('manager-role-001', 'manager-pharmazine-001', 'manager', NOW());

-- Create Employee user  
INSERT INTO profiles (id, full_name, email, password_hash, phone, created_at, updated_at)
VALUES (
    'employee-pharmazine-001',
    'Employee User',
    'employee@pharmazine.com',
    '$2b$12$MOldpeN4ROURjM/Wzzq1ruQur89xu2.VtgyM.yNaiuSQWMBedt02.',
    NULL,
    NOW(),
    NOW()
);

INSERT INTO user_roles (id, user_id, role, created_at)
VALUES ('employee-role-001', 'employee-pharmazine-001', 'employee', NOW());













