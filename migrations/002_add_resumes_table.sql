-- ========================================
-- MIGRATION 002: CREATE RESUMES TABLE
-- ========================================
-- Purpose: Add table to store user-generated resume data
-- 
-- This table stores all resume information including:
-- - Personal Info (name, contact details)
-- - Education (multiple entries with GPA, achievements)
-- - Work Experiences (multiple entries with descriptions)
-- - Projects (multiple entries with tech stacks)
-- - Technical Skills (categorized: Languages, Frameworks, etc.)
-- - Certifications (optional)
--
-- Data is stored as JSONB for flexibility and easy querying
-- ========================================

-- ========================================
-- CREATE RESUMES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS resumes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Resume Title: User-provided name (e.g., "Software Engineer Resume - Google")
  title VARCHAR(255) NOT NULL,
  
  -- Personal Information (JSONB)
  -- Example:
  -- {
  --   "firstName": "John",
  --   "lastName": "Doe",
  --   "phone": "555-1234",
  --   "email": "john@example.com",
  --   "linkedin": "linkedin.com/in/johndoe",  (optional)
  --   "github": "github.com/johndoe"          (optional)
  -- }
  personal_info JSONB NOT NULL,
  
  -- Education (JSONB Array - Multiple entries allowed)
  -- Example:
  -- [
  --   {
  --     "school": "University Name",
  --     "degree": "Bachelor's",
  --     "field": "Computer Science",
  --     "location": "City, State",
  --     "graduationDate": "May 2025",  (VARCHAR format: "Month Year")
  --     "gpa": "3.8/4.0",              (optional)
  --     "academicAchievements": ["Dean's List", "Summa Cum Laude"]  (optional array)
  --   }
  -- ]
  education JSONB DEFAULT '[]'::jsonb,
  
  -- Work Experiences (JSONB Array - Multiple entries allowed)
  -- Supports **bold** markdown in descriptions
  -- Example:
  -- [
  --   {
  --     "company": "Company Name",
  --     "role": "Software Engineer",
  --     "startDate": "Jan 2023",       (VARCHAR format: "Month Year")
  --     "endDate": "Dec 2024",         (VARCHAR format: "Month Year", null if current)
  --     "isCurrent": false,
  --     "location": "San Francisco, CA" or "Remote",  (required)
  --     "description": [
  --       "Improved performance by **30%** using React",
  --       "Led team of **5 developers**"
  --     ]  (array of bullet points, supports **bold** markdown)
  --   }
  -- ]
  experiences JSONB DEFAULT '[]'::jsonb,
  
  -- Projects (JSONB Array - Multiple entries allowed)
  -- Supports **bold** markdown in descriptions
  -- Example:
  -- [
  --   {
  --     "name": "Project Name",
  --     "techStack": ["Python", "React", "AWS", "DynamoDB"],  (array of technologies)
  --     "description": [
  --       "Built **full-stack** application",
  --       "Deployed on **AWS EC2** with CI/CD"
  --     ]  (array of bullet points, supports **bold** markdown)
  --   }
  -- ]
  projects JSONB DEFAULT '[]'::jsonb,
  
  -- Technical Skills (JSONB Object - Categorized)
  -- Required categories: "Languages", "Frameworks and Libraries", "Development Tools"
  -- Users can add custom categories (e.g., "AI Tools")
  -- Example:
  -- {
  --   "Languages": "Python, Javascript, C#",
  --   "Frameworks and Libraries": "React, Node.js, Express",
  --   "Development Tools": "Git, Docker, VS Code",
  --   "AI Tools": "VAPI, Gemini, ChatGPT"  (custom category)
  -- }
  skills JSONB DEFAULT '{}'::jsonb,
  
  -- Certifications (JSONB Array - Optional)
  -- Example:
  -- [
  --   {
  --     "name": "AWS Certified Solutions Architect",
  --     "issuer": "Amazon Web Services",
  --     "date": "Jan 2024",              (VARCHAR format: "Month Year")
  --     "expiryDate": "Jan 2027",        (optional, VARCHAR format: "Month Year")
  --     "credentialId": "ABC123",       (optional)
  --     "url": "https://..."             (optional)
  --   }
  -- ]
  certifications JSONB DEFAULT '[]'::jsonb,
  
  -- Source Tracking
  -- 'generated' = User created resume from scratch
  -- 'analyzed' = User came from analysis page → edited → generated
  source_type VARCHAR(20) DEFAULT 'generated' CHECK (source_type IN ('generated', 'analyzed')),
  
  -- Link to analysis if resume was created from analysis
  -- NULL if created from scratch
  analysis_id INTEGER REFERENCES resume_analyses(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================
-- Index on user_id for fast lookups of user's resumes
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);

-- Index on analysis_id for linking resumes to analyses
CREATE INDEX IF NOT EXISTS idx_resumes_analysis_id ON resumes(analysis_id);

-- Index on created_at for sorting by date
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at DESC);

-- Index on source_type for filtering by source
CREATE INDEX IF NOT EXISTS idx_resumes_source_type ON resumes(source_type);

-- ========================================
-- ADD AUTO-UPDATE TRIGGER
-- ========================================
-- Automatically update updated_at timestamp when record is modified
-- Uses the function created in migration 001_init.sql
DROP TRIGGER IF EXISTS update_resumes_updated_at ON resumes;
CREATE TRIGGER update_resumes_updated_at 
BEFORE UPDATE ON resumes 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- ✅ Table created: resumes
-- ✅ Indexes created: 4 indexes for performance
-- ✅ Trigger created: Auto-update updated_at
-- 
-- Next steps:
-- 1. Run this migration on your database
-- 2. Test by inserting a sample resume record
-- 3. Verify all fields are working correctly
-- ========================================

