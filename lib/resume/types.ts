/**
 * Resume Builder Type Definitions
 * Matches the database schema in migrations/002_add_resumes_table.sql
 */

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  graduationDate: string; // Format: "Month Year" (e.g., "May 2025")
  gpa?: string; // Optional
  academicAchievements?: string[]; // Optional array
  // Legacy fields (not in database schema, but might be used in form)
  startDate?: string;
  endDate?: string | null;
  isCurrent?: boolean;
}

export interface Experience {
  id: string;
  company: string;
  role: string; // or "position"
  startDate: string; // Format: "Month Year"
  endDate: string | null; // Format: "Month Year", null if current
  isCurrent: boolean;
  location: string; // Required, can be "Remote"
  description: string[]; // Array of bullet points, supports **bold** markdown
  // Legacy field name (bullets = description)
  bullets?: string[];
  type?: "job" | "internship" | "contract" | "freelance";
}

export interface Project {
  id: string;
  name: string;
  techStack: string[]; // Array of technologies
  description: string[]; // Array of bullet points, supports **bold** markdown
}

export interface Skill {
  id: string;
  name: string;
  category: "language" | "framework" | "tool" | "other";
}

// Skills stored as object in database: { "Languages": "Python, Javascript", ... }
export type SkillsObject = Record<string, string>;

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string; // Format: "Month Year"
  expiryDate?: string; // Optional, Format: "Month Year"
  credentialId?: string; // Optional
  url?: string; // Optional
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  education: Education[];
  experiences: Experience[];
  projects: Project[];
  skills: Skill[]; // For form use (array of Skill objects)
  certifications: Certification[];
  extracurriculars?: any[]; // Optional, not always used
}

