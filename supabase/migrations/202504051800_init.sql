

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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ApiKey" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "key" "text" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "lastUsed" timestamp with time zone
);


ALTER TABLE "public"."ApiKey" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."GraphEdge" (
    "id" "text" NOT NULL,
    "sourceType" "text" NOT NULL,
    "targetType" "text" NOT NULL,
    "sourceId" "text" NOT NULL,
    "targetId" "text" NOT NULL,
    "relationship" "text" NOT NULL,
    "weight" double precision,
    "properties" "text",
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "validatorId" "text",
    "voteSessionId" "text"
);


ALTER TABLE "public"."GraphEdge" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Reply" (
    "id" "text" NOT NULL,
    "body" "text" NOT NULL,
    "upvotes" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "threadId" "text" NOT NULL
);


ALTER TABLE "public"."Reply" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Thread" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "upvotes" integer DEFAULT 0 NOT NULL,
    "downvotes" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "voteSessionId" "text" NOT NULL
);


ALTER TABLE "public"."Thread" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Validator" (
    "id" "text" NOT NULL,
    "profileName" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "modelName" "text" NOT NULL,
    "publicKey" "text" NOT NULL,
    "isLeader" boolean DEFAULT false NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "description" "text",
    "avatarUrl" "text",
    "validatorType" "text",
    "reliability" double precision DEFAULT 0.0,
    "totalVotes" integer DEFAULT 0 NOT NULL,
    "correctVotes" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."Validator" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ValidatorKey" (
    "id" "text" NOT NULL,
    "validatorId" "text" NOT NULL,
    "apiKeyId" "text" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."ValidatorKey" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ValidatorResponse" (
    "id" "text" NOT NULL,
    "vote" "text" NOT NULL,
    "rationale" "text" NOT NULL,
    "confidence" double precision DEFAULT 0.5,
    "rationaleEmbedding" "text",
    "latency" integer,
    "matchedConsensus" boolean,
    "voteSessionId" "text" NOT NULL,
    "validatorId" "text" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "error" "text"
);


ALTER TABLE "public"."ValidatorResponse" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."VoteSession" (
    "id" "text" NOT NULL,
    "queryText" "text" NOT NULL,
    "context" "text",
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isConsensusReached" boolean NOT NULL,
    "consensusValue" boolean,
    "votesYes" integer DEFAULT 0 NOT NULL,
    "votesNo" integer DEFAULT 0 NOT NULL,
    "notVoted" integer DEFAULT 0 NOT NULL,
    "leaderId" "text",
    "txHash" "text",
    "blockchainNetwork" "text",
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."VoteSession" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_prisma_migrations" (
    "id" "text" NOT NULL,
    "checksum" "text" NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" "text" NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "_prisma_migrations_applied_steps_count_check" CHECK (("applied_steps_count" >= 0))
);


ALTER TABLE "public"."_prisma_migrations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ApiKey"
    ADD CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."GraphEdge"
    ADD CONSTRAINT "GraphEdge_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Reply"
    ADD CONSTRAINT "Reply_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Thread"
    ADD CONSTRAINT "Thread_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ValidatorKey"
    ADD CONSTRAINT "ValidatorKey_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ValidatorResponse"
    ADD CONSTRAINT "ValidatorResponse_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Validator"
    ADD CONSTRAINT "Validator_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."VoteSession"
    ADD CONSTRAINT "VoteSession_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");



CREATE INDEX "ApiKey_provider_isActive_idx" ON "public"."ApiKey" USING "btree" ("provider", "isActive");



CREATE INDEX "GraphEdge_relationship_idx" ON "public"."GraphEdge" USING "btree" ("relationship");



CREATE INDEX "GraphEdge_sourceType_sourceId_idx" ON "public"."GraphEdge" USING "btree" ("sourceType", "sourceId");



CREATE INDEX "GraphEdge_targetType_targetId_idx" ON "public"."GraphEdge" USING "btree" ("targetType", "targetId");



CREATE UNIQUE INDEX "ValidatorKey_validatorId_apiKeyId_key" ON "public"."ValidatorKey" USING "btree" ("validatorId", "apiKeyId");



CREATE INDEX "ValidatorResponse_matchedConsensus_idx" ON "public"."ValidatorResponse" USING "btree" ("matchedConsensus");



CREATE INDEX "ValidatorResponse_validatorId_idx" ON "public"."ValidatorResponse" USING "btree" ("validatorId");



CREATE INDEX "ValidatorResponse_voteSessionId_idx" ON "public"."ValidatorResponse" USING "btree" ("voteSessionId");



CREATE INDEX "ValidatorResponse_vote_idx" ON "public"."ValidatorResponse" USING "btree" ("vote");



CREATE INDEX "Validator_active_idx" ON "public"."Validator" USING "btree" ("active");



CREATE INDEX "Validator_provider_idx" ON "public"."Validator" USING "btree" ("provider");



CREATE INDEX "VoteSession_consensusValue_idx" ON "public"."VoteSession" USING "btree" ("consensusValue");



CREATE INDEX "VoteSession_isConsensusReached_idx" ON "public"."VoteSession" USING "btree" ("isConsensusReached");



CREATE INDEX "VoteSession_timestamp_idx" ON "public"."VoteSession" USING "btree" ("timestamp");



ALTER TABLE ONLY "public"."GraphEdge"
    ADD CONSTRAINT "GraphEdge_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "public"."Validator"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."GraphEdge"
    ADD CONSTRAINT "GraphEdge_voteSessionId_fkey" FOREIGN KEY ("voteSessionId") REFERENCES "public"."VoteSession"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Reply"
    ADD CONSTRAINT "Reply_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."Thread"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Thread"
    ADD CONSTRAINT "Thread_voteSessionId_fkey" FOREIGN KEY ("voteSessionId") REFERENCES "public"."VoteSession"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ValidatorKey"
    ADD CONSTRAINT "ValidatorKey_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "public"."ApiKey"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ValidatorKey"
    ADD CONSTRAINT "ValidatorKey_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "public"."Validator"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ValidatorResponse"
    ADD CONSTRAINT "ValidatorResponse_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "public"."Validator"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ValidatorResponse"
    ADD CONSTRAINT "ValidatorResponse_voteSessionId_fkey" FOREIGN KEY ("voteSessionId") REFERENCES "public"."VoteSession"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."ApiKey" TO "anon";
GRANT ALL ON TABLE "public"."ApiKey" TO "authenticated";
GRANT ALL ON TABLE "public"."ApiKey" TO "service_role";



GRANT ALL ON TABLE "public"."GraphEdge" TO "anon";
GRANT ALL ON TABLE "public"."GraphEdge" TO "authenticated";
GRANT ALL ON TABLE "public"."GraphEdge" TO "service_role";



GRANT ALL ON TABLE "public"."Reply" TO "anon";
GRANT ALL ON TABLE "public"."Reply" TO "authenticated";
GRANT ALL ON TABLE "public"."Reply" TO "service_role";



GRANT ALL ON TABLE "public"."Thread" TO "anon";
GRANT ALL ON TABLE "public"."Thread" TO "authenticated";
GRANT ALL ON TABLE "public"."Thread" TO "service_role";



GRANT ALL ON TABLE "public"."Validator" TO "anon";
GRANT ALL ON TABLE "public"."Validator" TO "authenticated";
GRANT ALL ON TABLE "public"."Validator" TO "service_role";



GRANT ALL ON TABLE "public"."ValidatorKey" TO "anon";
GRANT ALL ON TABLE "public"."ValidatorKey" TO "authenticated";
GRANT ALL ON TABLE "public"."ValidatorKey" TO "service_role";



GRANT ALL ON TABLE "public"."ValidatorResponse" TO "anon";
GRANT ALL ON TABLE "public"."ValidatorResponse" TO "authenticated";
GRANT ALL ON TABLE "public"."ValidatorResponse" TO "service_role";



GRANT ALL ON TABLE "public"."VoteSession" TO "anon";
GRANT ALL ON TABLE "public"."VoteSession" TO "authenticated";
GRANT ALL ON TABLE "public"."VoteSession" TO "service_role";



GRANT ALL ON TABLE "public"."_prisma_migrations" TO "anon";
GRANT ALL ON TABLE "public"."_prisma_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."_prisma_migrations" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
