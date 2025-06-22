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
-- Data for Name: Validator; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Validator" (id, "profileName", provider, "modelName", "publicKey", "isLeader", active, description, "avatarUrl", "validatorType", reliability, "totalVotes", "correctVotes", "createdAt", "updatedAt", "encryptedApiKey") FROM stdin;
\.


--
-- Data for Name: VoteSession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VoteSession" (id, "queryText", context, "timestamp", "isConsensusReached", "consensusValue", "votesYes", "votesNo", "notVoted", "leaderId", "txHash", "blockchainNetwork", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: GraphEdge; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GraphEdge" (id, "sourceType", "targetType", "sourceId", "targetId", relationship, weight, properties, "createdAt", "validatorId", "voteSessionId") FROM stdin;
\.


--
-- Data for Name: Thread; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Thread" (id, title, body, upvotes, downvotes, "createdAt", "updatedAt", "voteSessionId") FROM stdin;
\.


--
-- Data for Name: Reply; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Reply" (id, body, upvotes, "createdAt", "updatedAt", "threadId") FROM stdin;
\.


--
-- Data for Name: ValidatorResponse; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ValidatorResponse" (id, vote, rationale, confidence, "rationaleEmbedding", latency, "matchedConsensus", "voteSessionId", "validatorId", "createdAt", "updatedAt", error) FROM stdin;
\.


--
-- PostgreSQL database dump complete
--

