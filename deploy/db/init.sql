-- Runs once, when the Postgres volume is first created (docker-entrypoint-initdb.d).
-- The knowledge base's vector column needs this before `db:push` creates the tables.
CREATE EXTENSION IF NOT EXISTS vector;
