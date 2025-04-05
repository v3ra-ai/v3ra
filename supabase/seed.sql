SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: ApiKey; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ApiKey" ("id", "name", "provider", "key", "isActive", "createdAt", "updatedAt", "lastUsed") VALUES
	('1958c987-964c-42a2-96d9-1b8a7cac60f8', 'OpenAI Test Key', 'OpenAI', '3312c36ddd927335b9c67d5f612a906d2500eb47044659b5d8df2802c1c9475f', true, '2025-03-25 20:44:42.674+00', '2025-04-01 14:32:13.512+00', '2025-04-01 14:32:13.511+00'),
	('95da7df9-f13b-436e-a4df-deb56ecf5dc5', 'ClaudeAPI', 'Anthropic', 'a06864708b2492cba3ac92bb3607ba6df6a7533b3f90c3cf9634600c74a48779288fb50c80c32d8f3ec96fd5e3c0e8b0c2ef3acc0e682ecf73e83d8ccc7a79d523a26d715e192e610d75e6199f3763b260eb365c2c40db4d5ea508b9faa0cf3660fafb1232a92cbeaf88c1865b87f187', true, '2025-03-26 14:36:33.558+00', '2025-04-01 14:32:13.471+00', '2025-04-01 14:32:13.47+00'),
	('43badc43-4b34-4497-bbe8-1bc46a1562d6', 'Grok API Key', 'Grok', '5029c95c09f0d3912d817042e0fe94679b961b86e5ee5c0496ab31428882a886', true, '2025-03-27 10:30:48.02+00', '2025-04-01 14:32:13.467+00', '2025-04-01 14:32:13.466+00'),
	('d28293f2-3c44-4883-9257-92ae57953d1e', 'Google Test Key', 'Google', 'ad1b2d097feb03a272fd1228edea949b13067069e6788ad4f0d9dc1af8544f27', true, '2025-03-31 15:45:35.695+00', '2025-04-01 14:32:13.458+00', '2025-04-01 14:32:13.458+00');


--
-- Data for Name: Validator; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."Validator" ("id", "profileName", "provider", "modelName", "publicKey", "isLeader", "active", "description", "avatarUrl", "validatorType", "reliability", "totalVotes", "correctVotes", "createdAt", "updatedAt") VALUES
	('b6e88f6c-4b89-4965-8678-c7822ecd95be', 'GPT-4O Validator', 'OpenAI', 'gpt-4o', '9b27ad3c-a188-42e4-914d-3b136624fc9e', false, true, 'This validator uses OpenAI''s gpt-4o model, which excels at balanced decision-making based on multiple perspectives and ethical considerations.', NULL, 'Multimodal Reasoning Engine', 0, 56, 0, '2025-03-24 00:38:53.47+00', '2025-04-01 14:26:26.868+00'),
	('6d9eb3aa-134c-4358-925b-edb807700b73', 'SONNET-20240229 Validator', 'Anthropic', 'claude-3-sonnet-20240229', '6d9eb3aa-134c-4358-925b-edb807700b73', false, true, 'This validator leverages Anthropic''s claude-3-sonnet-20240229 model, known for its thoughtful approach to content evaluation and strong performance in factual verification tasks.', NULL, 'Constitutional AI Reasoner', 0, 39, 0, '2025-03-27 10:20:16.113+00', '2025-04-01 14:26:29.494+00'),
	('1192bc8f-32d9-406d-ba33-673d8996ada4', 'GROK-1 Validator', 'Grok', 'grok-1', '1192bc8f-32d9-406d-ba33-673d8996ada4', false, true, 'This validator leverages xAI''s grok-1 model for fact-checking, providing fast and contextually aware reasoning.', NULL, 'Contextual Reasoning Engine', 0, 35, 0, '2025-03-27 10:30:48.024+00', '2025-04-01 14:26:26.049+00'),
	('3d279b08-9b0a-46af-9b40-30b79ea7f787', 'GEMINI2.5 Validator', 'Google', 'gemini2.5', '3d279b08-9b0a-46af-9b40-30b79ea7f787', false, false, 'This validator uses Google''s gemini2.5 model, which provides efficient and reliable responses for general reasoning tasks.', NULL, 'Multimodal Generative Reasoning', 0, 0, 0, '2025-03-31 15:45:17.858+00', '2025-03-31 16:38:21.523+00'),
	('31a0275e-0703-493a-8a2e-b58ab117b92a', 'GEMINI Validator', 'Google', 'gemini', '31a0275e-0703-493a-8a2e-b58ab117b92a', false, true, 'This validator uses Google''s gemini model, which provides efficient and reliable responses for general reasoning tasks.', NULL, 'Multimodal Generative Reasoning', 0, 3, 0, '2025-03-31 16:34:52.757+00', '2025-04-01 14:26:26.165+00');


--
-- Data for Name: VoteSession; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."VoteSession" ("id", "queryText", "context", "timestamp", "isConsensusReached", "consensusValue", "votesYes", "votesNo", "notVoted", "leaderId", "txHash", "blockchainNetwork", "createdAt", "updatedAt") VALUES
	('37655d44-1622-4f48-a3d6-dd62ba23df67', 'Is artificial intelligence beneficial for society?', NULL, '2025-03-25 18:54:21.203+00', true, false, 0, 2, 0, NULL, NULL, NULL, '2025-03-25 18:54:21.204+00', '2025-03-25 18:54:21.367+00'),
	('8105db03-f612-45b3-800d-fe79279938a6', 'Is the sky blue?', NULL, '2025-03-25 19:49:46.213+00', true, false, 0, 2, 0, NULL, NULL, NULL, '2025-03-25 19:49:46.214+00', '2025-03-25 19:49:46.232+00'),
	('b67b0213-e9fe-44da-9879-50dcc3ebc90e', 'AI is smarter than majority of humans', NULL, '2025-04-01 14:26:25.05+00', true, false, 0, 4, 0, NULL, NULL, NULL, '2025-04-01 14:26:25.051+00', '2025-04-01 14:26:29.496+00'),
	('db8be63b-b610-406d-bffd-43169a7299dc', 'Unknown query', NULL, '2025-03-29 21:36:27.448+00', false, NULL, 0, 0, 0, NULL, NULL, NULL, '2025-03-29 21:36:27.448+00', '2025-03-29 21:36:27.448+00');


--
-- Data for Name: GraphEdge; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Thread; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."Thread" ("id", "title", "body", "upvotes", "downvotes", "createdAt", "updatedAt", "voteSessionId") VALUES
	('c41ed104-8e66-462d-8449-0864a33cad2a', 'proof of mis-using funds:', 'https://x.com/MilaLovesJoe/status/1905138291743379763', 0, 0, '2025-03-29 21:36:27.448+00', '2025-03-29 21:36:27.448+00', 'db8be63b-b610-406d-bffd-43169a7299dc');


--
-- Data for Name: Reply; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ValidatorKey; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ValidatorKey" ("id", "validatorId", "apiKeyId", "createdAt") VALUES
	('0dad34fd-0a2e-4e78-9901-8d555c3d302a', 'b6e88f6c-4b89-4965-8678-c7822ecd95be', '1958c987-964c-42a2-96d9-1b8a7cac60f8', '2025-03-25 20:44:42.691+00'),
	('d724048f-c38c-4225-ad52-bb5e020c5c30', '6d9eb3aa-134c-4358-925b-edb807700b73', '95da7df9-f13b-436e-a4df-deb56ecf5dc5', '2025-03-27 10:23:18.279+00'),
	('d289bcc8-9d86-4a65-bd5d-031edcf5e5bf', '1192bc8f-32d9-406d-ba33-673d8996ada4', '43badc43-4b34-4497-bbe8-1bc46a1562d6', '2025-03-27 10:30:48.024+00'),
	('5e0c2f3a-12a5-4f8b-9689-eec5f88d964b', '3d279b08-9b0a-46af-9b40-30b79ea7f787', 'd28293f2-3c44-4883-9257-92ae57953d1e', '2025-03-31 15:45:35.721+00'),
	('38d5ec51-d868-42ee-ad12-93fe98c7d6ef', '31a0275e-0703-493a-8a2e-b58ab117b92a', 'd28293f2-3c44-4883-9257-92ae57953d1e', '2025-03-31 19:15:26.472+00');


--
-- Data for Name: ValidatorResponse; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ValidatorResponse" ("id", "vote", "rationale", "confidence", "rationaleEmbedding", "latency", "matchedConsensus", "voteSessionId", "validatorId", "createdAt", "updatedAt", "error") VALUES
	('8ee07973-4ac1-4731-9b8b-3e688c773752', 'NO', 'Error: No API key available for OpenAI', 0, NULL, 1, NULL, '37655d44-1622-4f48-a3d6-dd62ba23df67', 'b6e88f6c-4b89-4965-8678-c7822ecd95be', '2025-03-25 18:54:21.223+00', '2025-03-25 18:54:21.223+00', 'No API key available for OpenAI'),
	('b8751ee1-39ae-43d9-bbe1-87ac23f8ac0b', 'NO', 'The statement is not factually accurate because "smarter" is subjective and depends on context. Current AI systems excel in specific tasks but lack the general intelligence, emotional understanding, and adaptability of the majority of humans.', 0.7, NULL, 968, NULL, 'b67b0213-e9fe-44da-9879-50dcc3ebc90e', '1192bc8f-32d9-406d-ba33-673d8996ada4', '2025-04-01 14:26:26.034+00', '2025-04-01 14:26:26.034+00', NULL);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES
	('da3fcddf-e23e-4cea-a894-ddf364bc4c11', 'b0ba44303b635acd35074ee4ae98831eb4484fb66a2b5c728336b9f84f4ea566', '2025-03-24 16:16:35.338+00', '20250324161635_initial_setup', NULL, NULL, '2025-03-24 16:16:35.285+00', 1),
	('860743c9-df70-4531-acff-6e9b8e384765', 'cc6841352b26225fc3a2d37de6327285e1c099f7251300de43998168998d4a10', '2025-03-28 13:10:12.349+00', '20250328131012_add_thread_reply_models', NULL, NULL, '2025-03-28 13:10:12.339+00', 1),
	('136a3e8d-3d03-4867-a36d-d44bcf60dc1d', 'ad13c8f3cc2d51e0e1e7ce5d4c16f1cf4e2ebcaf09b4f0d99362b1380065215c', '2025-03-28 17:48:29.7+00', '20250328174829_add_downvotes_to_thread', NULL, NULL, '2025-03-28 17:48:29.683+00', 1);


--
-- PostgreSQL database dump complete
--

RESET ALL;
