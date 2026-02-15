-- Enable useful PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'ResumeBuddy database initialized successfully with extensions: uuid-ossp, citext, pg_trgm';
END $$;
