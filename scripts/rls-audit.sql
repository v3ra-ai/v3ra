-- ============================================================================
-- RLS SECURITY AUDIT SCRIPT FOR TESTNET-DEMO
-- ============================================================================
-- WARNING: This is a READ-ONLY audit script. Do NOT modify any data.
-- Run this script to understand the current state before implementing RLS.
-- ============================================================================

-- 1. CHECK CURRENT RLS STATUS
-- ============================================================================
SELECT 
    '=== CURRENT RLS STATUS ===' as section;

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. CHECK FOR EXISTING POLICIES (should be empty if RLS is disabled)
-- ============================================================================
SELECT 
    '=== EXISTING RLS POLICIES ===' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. ANALYZE TABLE STRUCTURE FOR USER-RELATED COLUMNS
-- ============================================================================
SELECT 
    '=== TABLES WITH USER-RELATED COLUMNS ===' as section;

SELECT DISTINCT
    t.table_name,
    array_agg(DISTINCT c.column_name) FILTER (WHERE c.column_name IN ('user_id', 'owner_id', 'created_by', 'userId', 'walletPublicKey')) as user_columns,
    array_agg(DISTINCT c.column_name) FILTER (WHERE c.column_name LIKE '%credit%' OR c.column_name LIKE '%Credit%') as credit_columns
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
HAVING 
    array_agg(DISTINCT c.column_name) FILTER (WHERE c.column_name IN ('user_id', 'owner_id', 'created_by', 'userId', 'walletPublicKey')) IS NOT NULL
    OR array_agg(DISTINCT c.column_name) FILTER (WHERE c.column_name LIKE '%credit%' OR c.column_name LIKE '%Credit%') IS NOT NULL
ORDER BY t.table_name;

-- 4. DETAILED SCHEMA ANALYSIS
-- ============================================================================
SELECT 
    '=== DETAILED TABLE SCHEMA ===' as section;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 5. CHECK INDEXES FOR PERFORMANCE (important for RLS)
-- ============================================================================
SELECT 
    '=== INDEXES ON USER-RELATED COLUMNS ===' as section;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND (
        indexdef LIKE '%user_id%'
        OR indexdef LIKE '%userId%'
        OR indexdef LIKE '%owner_id%'
        OR indexdef LIKE '%created_by%'
        OR indexdef LIKE '%walletPublicKey%'
    )
ORDER BY tablename, indexname;

-- 6. ANALYZE FOREIGN KEY RELATIONSHIPS
-- ============================================================================
SELECT 
    '=== FOREIGN KEY RELATIONSHIPS ===' as section;

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 7. CHECK FOR EXISTING FUNCTIONS (especially SECURITY DEFINER)
-- ============================================================================
SELECT 
    '=== EXISTING FUNCTIONS ===' as section;

SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE p.prosecdef 
        WHEN true THEN 'SECURITY DEFINER ⚠️'
        ELSE 'SECURITY INVOKER'
    END as security_type,
    p.provolatile as volatility
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- 8. ANALYZE TABLE SIZES AND ROW COUNTS
-- ============================================================================
SELECT 
    '=== TABLE SIZES AND ROW COUNTS ===' as section;

SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    n_live_tup as approximate_row_count,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 9. CHECK CURRENT DATABASE CONNECTIONS
-- ============================================================================
SELECT 
    '=== CURRENT DATABASE CONNECTIONS ===' as section;

SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change
FROM pg_stat_activity
WHERE datname = current_database()
    AND pid <> pg_backend_pid()
ORDER BY query_start DESC
LIMIT 20;

-- 10. CRITICAL TABLES RISK ASSESSMENT
-- ============================================================================
SELECT 
    '=== RISK ASSESSMENT FOR CRITICAL TABLES ===' as section;

WITH critical_tables AS (
    SELECT 
        table_name,
        CASE 
            WHEN table_name IN ('User', 'UserCredit') THEN 'CRITICAL - User/Auth Data'
            WHEN table_name IN ('PaymentLog') THEN 'HIGH - Financial Data'
            WHEN table_name IN ('Validator', 'ValidatorKey') THEN 'MEDIUM - Cached System'
            WHEN table_name IN ('VoteSession', 'ValidatorResponse') THEN 'MEDIUM - Core Functionality'
            ELSE 'LOW - Reference Data'
        END as risk_level,
        CASE 
            WHEN table_name = 'User' THEN 'Contains freeCredits field - MUST use security definer functions'
            WHEN table_name = 'UserCredit' THEN 'Financial data - strict access control needed'
            WHEN table_name IN ('Validator', 'ValidatorKey') THEN 'Recently cached - verify cache invalidation'
            ELSE 'Standard RLS policies should suffice'
        END as special_notes
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
)
SELECT * FROM critical_tables
ORDER BY 
    CASE 
        WHEN risk_level LIKE 'CRITICAL%' THEN 1
        WHEN risk_level LIKE 'HIGH%' THEN 2
        WHEN risk_level LIKE 'MEDIUM%' THEN 3
        ELSE 4
    END,
    table_name;

-- 11. SUMMARY AND RECOMMENDATIONS
-- ============================================================================
SELECT 
    '=== AUDIT SUMMARY ===' as section;

SELECT 
    COUNT(*) FILTER (WHERE NOT rowsecurity) as tables_without_rls,
    COUNT(*) FILTER (WHERE rowsecurity) as tables_with_rls,
    COUNT(*) as total_tables
FROM pg_tables
WHERE schemaname = 'public';

-- End of audit script
-- Next steps: Review output and create RLS implementation plan
