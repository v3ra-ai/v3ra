-- Add optional unique username column to User table
alter table "User" add column if not exists username text;
-- Ensure uniqueness constraint
create unique index if not exists user_username_key on "User"(username);
