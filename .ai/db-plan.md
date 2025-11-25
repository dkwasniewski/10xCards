# Database Schema Plan

## 1. Tables

### users

This table is managed by Subabase Auth.

- **id** UUID PRIMARY KEY DEFAULT gen_random_uuid()
- **email** VARCHAR(320) NOT NULL UNIQUE
- **password_hash** TEXT NOT NULL
- **created_at** TIMESTAMPTZ NOT NULL DEFAULT now()
- **updated_at** TIMESTAMPTZ NOT NULL DEFAULT now()

### ai_generation_sessions

- **id** UUID PRIMARY KEY DEFAULT gen_random_uuid()
- **user_id** UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- **input_text** TEXT NOT NULL CHECK (char_length(input_text) BETWEEN 1000 AND 10000)
- **created_at** TIMESTAMPTZ NOT NULL DEFAULT now()
- **updated_at** TIMESTAMPTZ NOT NULL DEFAULT now()
- **model** TEXT
- **accepted_unedited_count** INTEGER NULLABLE
- **accepted_edited_count** INTEGER NULLABLE
- **generation_DURATION**: INTEGER NOT NULL

### flashcards

- **id** UUID PRIMARY KEY DEFAULT gen_random_uuid()
- **user_id** UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- **ai_session_id** UUID REFERENCES ai_generation_sessions(id) ON DELETE SET NULL
- **source** flashcard_source NOT NULL
- **front** VARCHAR(200) NOT NULL
- **back** VARCHAR(500) NOT NULL
- **model** TEXT
- **prompt** TEXT
- **tsv** tsvector GENERATED ALWAYS AS (to_tsvector('english', front || ' ' || back)) STORED
- **created_at** TIMESTAMPTZ NOT NULL DEFAULT now()
- **updated_at** TIMESTAMPTZ NOT NULL DEFAULT now()
- **deleted_at** TIMESTAMPTZ NULL

### reviews

- **id** UUID PRIMARY KEY DEFAULT gen_random_uuid()
- **user_id** UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- **flashcard_id** UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE
- **rating** SMALLINT NOT NULL
- **reviewed_at** TIMESTAMPTZ NOT NULL DEFAULT now()
- **next_due** TIMESTAMPTZ NOT NULL
- **deleted_at** TIMESTAMPTZ NULL

### event_logs

- **id** UUID PRIMARY KEY DEFAULT gen_random_uuid()
- **user_id** UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- **flashcard_id** UUID NULL REFERENCES flashcards(id)
- **event_type** TEXT NOT NULL
- **event_source** flashcard_source NOT NULL
- **ai_session_id** UUID NULL REFERENCES ai_generation_sessions(id)
- **review_id** UUID NULL REFERENCES reviews(id)
- **created_at** TIMESTAMPTZ NOT NULL DEFAULT now()

## 2. Relationships

- **users** 1––N → **ai_generation_sessions**
- **users** 1––N → **flashcards**
- **users** 1––N → **reviews**
- **users** 1––N → **event_logs**
- **ai_generation_sessions** 1––N → **flashcards**
- **flashcards** 1––N → **reviews**
- **flashcards** 1––N → **event_logs**
- **reviews** 1––N → **event_logs**

## 3. Indexes

- `GIN` index on `flashcards(tsv)` for full-text search
- `BTree` index on `ai_generation_sessions(user_id, created_at)`
- `BTree` index on `reviews(next_due)`
- `BTree` index on `event_logs(user_id, created_at)`
- `BTree` index on `flashcards(user_id)`
- `BTree` index on `flashcards(ai_session_id)`
- `BTree` index on `reviews(user_id)`
- `BTree` index on `reviews(flashcard_id)`

## 4. PostgreSQL Rules (Row-Level Security)

- Enable RLS on `flashcards` and `reviews`:
  ```sql
  ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
  ALTER TABLE reviews   ENABLE ROW LEVEL SECURITY;
  ```
- Policies for owner-based access:

  ```sql
  CREATE POLICY flashcards_access ON flashcards
    FOR SELECT, UPDATE, DELETE USING (user_id = auth.uid());
  CREATE POLICY flashcards_insert ON flashcards
    FOR INSERT WITH CHECK (user_id = auth.uid());

  CREATE POLICY reviews_access ON reviews
    FOR SELECT, UPDATE, DELETE USING (user_id = auth.uid());
  CREATE POLICY reviews_insert ON reviews
    FOR INSERT WITH CHECK (user_id = auth.uid());
  ```

## 5. Enums, Triggers & Extensions

- Enum type for flashcard source:
  ```sql
  CREATE TYPE flashcard_source AS ENUM ('manual', 'ai');
  ```
- Trigger to update `updated_at` on row modification:

  ```sql
  CREATE OR REPLACE FUNCTION update_timestamp()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Attach to tables with updated_at
  CREATE TRIGGER users_update_ts
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
  CREATE TRIGGER flashcards_update_ts
    BEFORE UPDATE ON flashcards FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
  CREATE TRIGGER reviews_update_ts
    BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
  CREATE TRIGGER ai_sessions_update_ts
    BEFORE UPDATE ON ai_generation_sessions FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

  CREATE TRIGGER event_logs_update_ts
    BEFORE UPDATE ON event_logs FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
  ```

- Enable `pg_trgm` and `pgcrypto` extensions:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  ```

## 6. Additional Notes

- Soft-deleted records (`deleted_at` not null) are excluded via application-layer filters or indexed partial indexes.
- Future archiving: consider partitioning `event_logs` by date for high-volume scenarios.
- Normalize to 3NF; denormalization only if analytics queries demand it.

