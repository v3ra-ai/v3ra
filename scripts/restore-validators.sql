-- Script to restore validators to production database
-- Based on backup from supabase/seed.sql

-- First, delete existing validators to avoid conflicts (be careful with this in production!)
-- DELETE FROM "ValidatorResponse";
-- DELETE FROM "ValidatorKey";
-- DELETE FROM "Validator";

-- Insert API Keys (if not already present)
INSERT INTO "public"."ApiKey" ("id", "name", "provider", "key", "isActive", "createdAt", "updatedAt", "lastUsed") VALUES
  ('1958c987-964c-42a2-96d9-1b8a7cac60f8', 'OpenAI Test Key', 'OpenAI', '3312c36ddd927335b9c67d5f612a906d2500eb47044659b5d8df2802c1c9475f', true, NOW(), NOW(), NOW()),
  ('95da7df9-f13b-436e-a4df-deb56ecf5dc5', 'ClaudeAPI', 'Anthropic', 'a06864708b2492cba3ac92bb3607ba6df6a7533b3f90c3cf9634600c74a48779288fb50c80c32d8f3ec96fd5e3c0e8b0c2ef3acc0e682ecf73e83d8ccc7a79d523a26d715e192e610d75e6199f3763b260eb365c2c40db4d5ea508b9faa0cf3660fafb1232a92cbeaf88c1865b87f187', true, NOW(), NOW(), NOW()),
  ('43badc43-4b34-4497-bbe8-1bc46a1562d6', 'Grok API Key', 'Grok', '5029c95c09f0d3912d817042e0fe94679b961b86e5ee5c0496ab31428882a886', true, NOW(), NOW(), NOW()),
  ('d28293f2-3c44-4883-9257-92ae57953d1e', 'Google Test Key', 'Google', 'ad1b2d097feb03a272fd1228edea949b13067069e6788ad4f0d9dc1af8544f27', true, NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- Insert Validators
INSERT INTO "public"."Validator" ("id", "profileName", "provider", "modelName", "publicKey", "isLeader", "active", "description", "avatarUrl", "validatorType", "reliability", "totalVotes", "correctVotes", "createdAt", "updatedAt") VALUES
  ('b6e88f6c-4b89-4965-8678-c7822ecd95be', 'GPT-4O Validator', 'OpenAI', 'gpt-4o', '9b27ad3c-a188-42e4-914d-3b136624fc9e', false, true, 'This validator uses OpenAI''s gpt-4o model, which excels at balanced decision-making based on multiple perspectives and ethical considerations.', '/validators/openai.jpg', 'Multimodal Reasoning Engine', 0, 0, 0, NOW(), NOW()),
  ('6d9eb3aa-134c-4358-925b-edb807700b73', 'SONNET-20240229 Validator', 'Anthropic', 'claude-3-sonnet-20240229', '6d9eb3aa-134c-4358-925b-edb807700b73', false, true, 'This validator leverages Anthropic''s claude-3-sonnet-20240229 model, known for its thoughtful approach to content evaluation and strong performance in factual verification tasks.', '/validators/anthropic.jpg', 'Constitutional AI Reasoner', 0, 0, 0, NOW(), NOW()),
  ('1192bc8f-32d9-406d-ba33-673d8996ada4', 'GROK-1 Validator', 'Grok', 'grok-1', '1192bc8f-32d9-406d-ba33-673d8996ada4', false, true, 'This validator leverages xAI''s grok-1 model for fact-checking, providing fast and contextually aware reasoning.', '/validators/grok.jpg', 'Contextual Reasoning Engine', 0, 0, 0, NOW(), NOW()),
  ('3d279b08-9b0a-46af-9b40-30b79ea7f787', 'GEMINI2.5 Validator', 'Google', 'gemini2.5', '3d279b08-9b0a-46af-9b40-30b79ea7f787', false, false, 'This validator uses Google''s gemini2.5 model, which provides efficient and reliable responses for general reasoning tasks.', '/validators/gemini.jpg', 'Multimodal Generative Reasoning', 0, 0, 0, NOW(), NOW()),
  ('31a0275e-0703-493a-8a2e-b58ab117b92a', 'GEMINI Validator', 'Google', 'gemini', '31a0275e-0703-493a-8a2e-b58ab117b92a', false, true, 'This validator uses Google''s gemini model, which provides efficient and reliable responses for general reasoning tasks.', '/validators/gemini.jpg', 'Multimodal Generative Reasoning', 0, 0, 0, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  "active" = EXCLUDED."active",
  "description" = EXCLUDED."description",
  "avatarUrl" = EXCLUDED."avatarUrl",
  "updatedAt" = NOW();

-- Insert ValidatorKey relationships
INSERT INTO "public"."ValidatorKey" ("id", "validatorId", "apiKeyId", "createdAt") VALUES
  ('0dad34fd-0a2e-4e78-9901-8d555c3d302a', 'b6e88f6c-4b89-4965-8678-c7822ecd95be', '1958c987-964c-42a2-96d9-1b8a7cac60f8', NOW()),
  ('d724048f-c38c-4225-ad52-bb5e020c5c30', '6d9eb3aa-134c-4358-925b-edb807700b73', '95da7df9-f13b-436e-a4df-deb56ecf5dc5', NOW()),
  ('d289bcc8-9d86-4a65-bd5d-031edcf5e5bf', '1192bc8f-32d9-406d-ba33-673d8996ada4', '43badc43-4b34-4497-bbe8-1bc46a1562d6', NOW()),
  ('5e0c2f3a-12a5-4f8b-9689-eec5f88d964b', '3d279b08-9b0a-46af-9b40-30b79ea7f787', 'd28293f2-3c44-4883-9257-92ae57953d1e', NOW()),
  ('38d5ec51-d868-42ee-ad12-93fe98c7d6ef', '31a0275e-0703-493a-8a2e-b58ab117b92a', 'd28293f2-3c44-4883-9257-92ae57953d1e', NOW())
ON CONFLICT (id) DO NOTHING;

-- Additional validators to expand the selection
INSERT INTO "public"."Validator" ("id", "profileName", "provider", "modelName", "publicKey", "isLeader", "active", "description", "avatarUrl", "validatorType", "reliability", "totalVotes", "correctVotes", "createdAt", "updatedAt") VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Claude 3 Opus', 'Anthropic', 'claude-3-opus-20240229', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', false, true, 'Anthropic''s most powerful model for complex reasoning and analysis', '/validators/anthropic.jpg', 'Constitutional AI', 0, 0, 0, NOW(), NOW()),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'GPT-4 Turbo', 'OpenAI', 'gpt-4-turbo-preview', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', false, true, 'Fast and efficient version of GPT-4 with updated knowledge', '/validators/openai.jpg', 'Reasoning Engine', 0, 0, 0, NOW(), NOW()),
  ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Gemini 1.5 Pro', 'Google', 'gemini-1.5-pro', 'c3d4e5f6-a7b8-9012-cdef-345678901234', false, true, 'Google''s advanced model with extended context window', '/validators/gemini.jpg', 'Multimodal Reasoning', 0, 0, 0, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  "active" = EXCLUDED."active",
  "description" = EXCLUDED."description",
  "avatarUrl" = EXCLUDED."avatarUrl",
  "updatedAt" = NOW();

-- Link new validators to existing API keys
INSERT INTO "public"."ValidatorKey" ("id", "validatorId", "apiKeyId", "createdAt") VALUES
  (gen_random_uuid()::text, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '95da7df9-f13b-436e-a4df-deb56ecf5dc5', NOW()),
  (gen_random_uuid()::text, 'b2c3d4e5-f6a7-8901-bcde-f23456789012', '1958c987-964c-42a2-96d9-1b8a7cac60f8', NOW()),
  (gen_random_uuid()::text, 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'd28293f2-3c44-4883-9257-92ae57953d1e', NOW())
ON CONFLICT DO NOTHING;