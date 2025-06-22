-- Fix permissions for public schema and tables

-- Grant usage on public schema to authenticated and anon roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on all tables in public schema to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant permissions on all sequences in public schema to authenticated users
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- For anon role, only grant SELECT on specific tables if needed
GRANT SELECT ON public."Validator" TO anon;
GRANT SELECT ON public."VoteSession" TO anon;
GRANT SELECT ON public."ValidatorResponse" TO anon;

-- Enable RLS on Favorite table and create policies
ALTER TABLE public."Favorite" ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own favorites
CREATE POLICY "Users can manage own favorites" ON public."Favorite"
    FOR ALL
    TO authenticated
    USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

-- Enable RLS on User table and create policies
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can read own data" ON public."User"
    FOR SELECT
    TO authenticated
    USING (id::text = auth.uid()::text);

-- Policy for users to update their own data
CREATE POLICY "Users can update own data" ON public."User"
    FOR UPDATE
    TO authenticated
    USING (id::text = auth.uid()::text)
    WITH CHECK (id::text = auth.uid()::text);

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION public.decrement_free_credits(uuid, integer, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_free_credits(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_credit_balance(uuid) TO authenticated;

-- Ensure credit_audit_log permissions
GRANT SELECT ON public.credit_audit_log TO authenticated;

-- Create policy for credit_audit_log if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'credit_audit_log' 
        AND policyname = 'Users can read own audit logs'
    ) THEN
        CREATE POLICY "Users can read own audit logs" ON public.credit_audit_log
            FOR SELECT
            TO authenticated
            USING (user_id::text = auth.uid()::text);
    END IF;
END $$;