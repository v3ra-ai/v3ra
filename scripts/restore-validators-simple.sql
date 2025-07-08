-- Simple script to restore validators to Supabase
-- This only inserts the validators, assuming API keys already exist

-- Insert the 5 original validators from backup
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

-- Verify the insert worked
SELECT id, "profileName", provider, active FROM "public"."Validator" ORDER BY "createdAt" DESC;