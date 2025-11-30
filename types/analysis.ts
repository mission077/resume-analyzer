export interface ResumeAnalysis {
  id: number;
  user_id: number;
  file_name: string;
  company_name: string;
  job_title: string;
  job_description: string;
  resume_text: string;
  overall_score: number | null;
  ats_score: number | null;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  created_at: Date;
  updated_at: Date;
  status: string;
}

export interface AnalysisListItem {
  id: number;
  file_name: string;
  company_name: string;
  job_title: string;
  overall_score: number | null;
  created_at: Date;
}
