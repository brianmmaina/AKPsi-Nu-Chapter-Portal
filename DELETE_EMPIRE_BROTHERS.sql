-- SQL Commands to delete EMPIRE family brothers and relationships
-- Run these in Supabase SQL Editor

-- Step 1: Delete relationships first (foreign key constraint)
DELETE FROM relationships 
WHERE family_id = (SELECT id FROM families WHERE name = 'EMPIRE');

-- Step 2: Delete all brothers in EMPIRE family
DELETE FROM brothers 
WHERE family_id = (SELECT id FROM families WHERE name = 'EMPIRE');

-- Optional: Verify deletion (should return 0 rows)
SELECT COUNT(*) as remaining_brothers 
FROM brothers 
WHERE family_id = (SELECT id FROM families WHERE name = 'EMPIRE');

SELECT COUNT(*) as remaining_relationships 
FROM relationships 
WHERE family_id = (SELECT id FROM families WHERE name = 'EMPIRE');

