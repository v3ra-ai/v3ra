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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: GraphEdge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GraphEdge" (
    id text NOT NULL,
    "sourceType" text NOT NULL,
    "targetType" text NOT NULL,
    "sourceId" text NOT NULL,
    "targetId" text NOT NULL,
    relationship text NOT NULL,
    weight double precision,
    properties text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "validatorId" text,
    "voteSessionId" text
);


--
-- Name: Reply; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Reply" (
    id text NOT NULL,
    body text NOT NULL,
    upvotes integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "threadId" text NOT NULL
);


--
-- Name: Thread; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Thread" (
    id text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    upvotes integer DEFAULT 0 NOT NULL,
    downvotes integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "voteSessionId" text NOT NULL
);


--
-- Name: Validator; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Validator" (
    id text NOT NULL,
    "profileName" text NOT NULL,
    provider text NOT NULL,
    "modelName" text NOT NULL,
    "publicKey" text NOT NULL,
    "isLeader" boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL,
    description text,
    "avatarUrl" text,
    "validatorType" text,
    reliability double precision DEFAULT 0.0,
    "totalVotes" integer DEFAULT 0 NOT NULL,
    "correctVotes" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "encryptedApiKey" text
);


--
-- Name: ValidatorResponse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ValidatorResponse" (
    id text NOT NULL,
    vote text NOT NULL,
    rationale text NOT NULL,
    confidence double precision DEFAULT 0.5,
    "rationaleEmbedding" text,
    latency integer,
    "matchedConsensus" boolean,
    "voteSessionId" text NOT NULL,
    "validatorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    error text
);


--
-- Name: VoteSession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VoteSession" (
    id text NOT NULL,
    "queryText" text NOT NULL,
    context text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isConsensusReached" boolean NOT NULL,
    "consensusValue" boolean,
    "votesYes" integer DEFAULT 0 NOT NULL,
    "votesNo" integer DEFAULT 0 NOT NULL,
    "notVoted" integer DEFAULT 0 NOT NULL,
    "leaderId" text,
    "txHash" text,
    "blockchainNetwork" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: GraphEdge GraphEdge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GraphEdge"
    ADD CONSTRAINT "GraphEdge_pkey" PRIMARY KEY (id);


--
-- Name: Reply Reply_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reply"
    ADD CONSTRAINT "Reply_pkey" PRIMARY KEY (id);


--
-- Name: Thread Thread_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Thread"
    ADD CONSTRAINT "Thread_pkey" PRIMARY KEY (id);


--
-- Name: ValidatorResponse ValidatorResponse_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ValidatorResponse"
    ADD CONSTRAINT "ValidatorResponse_pkey" PRIMARY KEY (id);


--
-- Name: Validator Validator_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Validator"
    ADD CONSTRAINT "Validator_pkey" PRIMARY KEY (id);


--
-- Name: VoteSession VoteSession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteSession"
    ADD CONSTRAINT "VoteSession_pkey" PRIMARY KEY (id);


--
-- Name: GraphEdge_relationship_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GraphEdge_relationship_idx" ON public."GraphEdge" USING btree (relationship);


--
-- Name: GraphEdge_sourceType_sourceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GraphEdge_sourceType_sourceId_idx" ON public."GraphEdge" USING btree ("sourceType", "sourceId");


--
-- Name: GraphEdge_targetType_targetId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GraphEdge_targetType_targetId_idx" ON public."GraphEdge" USING btree ("targetType", "targetId");


--
-- Name: ValidatorResponse_matchedConsensus_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ValidatorResponse_matchedConsensus_idx" ON public."ValidatorResponse" USING btree ("matchedConsensus");


--
-- Name: ValidatorResponse_validatorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ValidatorResponse_validatorId_idx" ON public."ValidatorResponse" USING btree ("validatorId");


--
-- Name: ValidatorResponse_voteSessionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ValidatorResponse_voteSessionId_idx" ON public."ValidatorResponse" USING btree ("voteSessionId");


--
-- Name: ValidatorResponse_vote_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ValidatorResponse_vote_idx" ON public."ValidatorResponse" USING btree (vote);


--
-- Name: Validator_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Validator_active_idx" ON public."Validator" USING btree (active);


--
-- Name: Validator_provider_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Validator_provider_idx" ON public."Validator" USING btree (provider);


--
-- Name: VoteSession_consensusValue_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VoteSession_consensusValue_idx" ON public."VoteSession" USING btree ("consensusValue");


--
-- Name: VoteSession_isConsensusReached_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VoteSession_isConsensusReached_idx" ON public."VoteSession" USING btree ("isConsensusReached");


--
-- Name: VoteSession_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VoteSession_timestamp_idx" ON public."VoteSession" USING btree ("timestamp");


--
-- Name: GraphEdge GraphEdge_validatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GraphEdge"
    ADD CONSTRAINT "GraphEdge_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES public."Validator"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GraphEdge GraphEdge_voteSessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GraphEdge"
    ADD CONSTRAINT "GraphEdge_voteSessionId_fkey" FOREIGN KEY ("voteSessionId") REFERENCES public."VoteSession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Reply Reply_threadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reply"
    ADD CONSTRAINT "Reply_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES public."Thread"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Thread Thread_voteSessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Thread"
    ADD CONSTRAINT "Thread_voteSessionId_fkey" FOREIGN KEY ("voteSessionId") REFERENCES public."VoteSession"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ValidatorResponse ValidatorResponse_validatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ValidatorResponse"
    ADD CONSTRAINT "ValidatorResponse_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES public."Validator"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ValidatorResponse ValidatorResponse_voteSessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ValidatorResponse"
    ADD CONSTRAINT "ValidatorResponse_voteSessionId_fkey" FOREIGN KEY ("voteSessionId") REFERENCES public."VoteSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

