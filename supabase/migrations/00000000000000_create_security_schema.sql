-- Create security schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS security;

-- Grant usage on security schema to authenticated users
GRANT USAGE ON SCHEMA security TO authenticated;

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS security.audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON security.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON security.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON security.audit_log(created_at);