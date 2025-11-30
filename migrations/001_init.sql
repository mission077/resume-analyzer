-- ========================================
-- 1. CREATE USERS TABLE (Must be first!)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  last_signed_in TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ========================================
-- 2. CREATE RESUME_ANALYSES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS resume_analyses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Form Input Data
  file_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  job_description TEXT NOT NULL,
  resume_text TEXT NOT NULL,
  
  -- AI Analysis Results
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
  strengths JSONB DEFAULT '[]'::jsonb,
  gaps JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_id ON resume_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_created_at ON resume_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_status ON resume_analyses(status);

-- ========================================
-- 3. AUTO-UPDATE TIMESTAMP FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 4. APPLY TRIGGERS
-- ========================================

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for resume_analyses table
DROP TRIGGER IF EXISTS update_resume_analyses_updated_at ON resume_analyses;
CREATE TRIGGER update_resume_analyses_updated_at 
BEFORE UPDATE ON resume_analyses 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- Tables created:
--   1. users
--   2. resume_analyses
-- 
-- Indexes created:
--   - idx_users_email
--   - idx_resume_analyses_user_id
--   - idx_resume_analyses_created_at
--   - idx_resume_analyses_status
--
-- Triggers created:
--   - Auto-update updated_at on users
--   - Auto-update updated_at on resume_analyses
-- ========================================