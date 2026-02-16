-- Promote a user to ADMIN by email
-- Run with:
--   npx prisma db execute --schema packages/database/prisma/schema.prisma --file scripts/promote-admin.sql

UPDATE users
SET role = 'ADMIN'
WHERE lower(email) = 'resumebuddy0@gmail.com';

SELECT id, email, role, status
FROM users
WHERE lower(email) = 'resumebuddy0@gmail.com';
