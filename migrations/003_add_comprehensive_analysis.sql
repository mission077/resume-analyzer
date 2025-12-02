-- ========================================
-- MIGRATION 003: ADD COMPREHENSIVE ANALYSIS COLUMN
-- ========================================
-- Purpose: Add JSONB column to store comprehensive analysis structure
-- 
-- This migration adds an 'analysis' JSONB column to resume_analyses table
-- to store the new comprehensive analysis structure including:
-- - ATS score with status
-- - Detailed analysis (content quality, skills match, etc.)
-- - Pros & Cons
-- - Missing keywords (grouped by priority)
-- - Key insights
-- - Section feedback (for form highlighting)
--
-- The old columns (overall_score, ats_score, strengths, gaps, recommendations)
-- are kept for backward compatibility
-- ========================================

-- Add analysis JSONB column
ALTER TABLE resume_analyses 
ADD COLUMN IF NOT EXISTS analysis JSONB;

-- Create index on analysis column for better query performance
CREATE INDEX IF NOT EXISTS idx_resume_analyses_analysis 
ON resume_analyses USING GIN (analysis);

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- ✅ Column added: analysis (JSONB)
-- ✅ Index created: idx_resume_analyses_analysis
-- 
-- Next steps:
-- 1. Run this migration on your database
-- 2. Update API routes to save comprehensive analysis to 'analysis' column
-- 3. Update API routes to return comprehensive analysis from 'analysis' column
-- ========================================

