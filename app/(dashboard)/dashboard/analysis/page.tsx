"use client"

import { useState, useEffect, useRef } from 'react'

// Mock data structure
interface AnalysisData {
  overallScore: number
  strengths: string[]
  gaps: string[]
  recommendations: string[]
  atsScore: number
  resumeText: string
  jobDetails: {
    company: string
    title: string
    description: string
  }
}

// Mock data fallback
const mockAnalysisData: AnalysisData = {
  overallScore: 78,
  strengths: [
    "Strong technical skills in Python and JavaScript",
    "Relevant coursework in Data Structures and Algorithms",
    "Web development experience with modern frameworks",
    "Good academic standing at Arkansas State University"
  ],
  gaps: [
    "Missing specific project details and GitHub links",
    "No quantifiable achievements or metrics",
    "Limited experience with cloud platforms (AWS, Azure)",
    "No mention of testing frameworks or CI/CD"
  ],
  recommendations: [
    "Add 2-3 detailed projects with GitHub links and live demos",
    "Include specific metrics and achievements (e.g., 'Improved performance by 30%')",
    "Learn and showcase cloud platform experience",
    "Add testing and DevOps skills to your toolkit"
  ],
  atsScore: 65,
  resumeText: "Nghia M. Vu\nArkansas State University • B.S. Computer Science, Expected July 2026\nnghia.vu@smail.astate.edu | (870)-497-7935\n\nEducation:\nArkansas State University, Jonesboro, AR\nB.S. Computer Science, Expected July 2026\n\nSkills:\n• Programming Languages: Python, JavaScript, C++\n• Web Development: HTML, CSS, React\n• Databases: SQL, MySQL\n• Tools: Git, VS Code\n\nExperience:\nSoftware Development Intern - Nucor Corporation\n• Developed and maintained internal applications\n• Worked with C# and PHP\n• Integrated with SQL Server databases\n• Implemented CI/CD workflows in Azure DevOps",
  jobDetails: {
    company: "Twitch Interactive",
    title: "Software Development Intern",
    description: "About the Role: This internship is for undergraduate students in computer science. You'll work on challenging engineering problems at scale, with comprehensive support from a Manager, Mentor, and Early Careers Advisor. You'll contribute to product design, build solutions from idea to production, and connect with intern peers and colleagues."
  }
}

export default function AnalysisPage() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    // Skip if we already loaded data (prevents React StrictMode double-run issue)
    if (hasLoadedRef.current) {
      return
    }

    // Try to get real data from localStorage first
    const storedData = localStorage.getItem('analysisData')
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        console.log('📊 Loaded analysis data from localStorage:', parsedData)
        console.log('🔍 Checking for analysis property:', parsedData.analysis)
        
        // Check if we have real analysis data
        if (parsedData.analysis) {
          console.log('✅ Found analysis data, setting state...')
          const analysis = parsedData.analysis
          // Also try to get job details and resume text from the stored data
          const jobDetails = parsedData.data || {}
          
          const realData = {
            overallScore: analysis.overallScore || 75,
            strengths: analysis.strengths || [],
            gaps: analysis.gaps || [],
            recommendations: analysis.recommendations || [],
            atsScore: analysis.atsScore || 70,
            resumeText: jobDetails.resumeText || parsedData.resumeText || '',
            jobDetails: {
              company: jobDetails.companyName || 'Unknown Company',
              title: jobDetails.jobTitle || 'Unknown Position',
              description: jobDetails.jobDescription || 'No description provided'
            }
          }
          
          setAnalysisData(realData)
          hasLoadedRef.current = true
          // Clear the stored data AFTER we've successfully set it
          localStorage.removeItem('analysisData')
        } else {
          // Fallback to mock data if structure is unexpected
          console.warn('⚠️ Unexpected data structure, using mock data')
          console.warn('⚠️ Parsed data keys:', Object.keys(parsedData))
          console.warn('⚠️ Parsed data:', parsedData)
          setAnalysisData(mockAnalysisData)
          hasLoadedRef.current = true
        }
      } catch (error) {
        console.error('Error parsing stored analysis data:', error)
        setAnalysisData(mockAnalysisData)
        hasLoadedRef.current = true
      }
    } else {
      // Fallback to mock data if no stored data
      console.warn('⚠️ No stored analysis data found, using mock data')
      setAnalysisData(mockAnalysisData)
      hasLoadedRef.current = true
    }
  }, [])

  if (!analysisData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Resume Analysis Complete
          </h1>
          <p className="text-muted-foreground">
            Here's your detailed analysis for {analysisData.jobDetails.company}
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Resume Info */}
          <div className="space-y-6">
            {/* Job Details Card */}
            <div className="bg-card rounded-lg shadow-md p-6 border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Company:</span>
                  <p className="text-gray-900">{analysisData.jobDetails.company}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Position:</span>
                  <p className="text-gray-900">{analysisData.jobDetails.title}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="text-gray-600 text-sm mt-1">{analysisData.jobDetails.description}</p>
                </div>
              </div>
            </div>

            {/* Resume Preview Card */}
            <div className="bg-card rounded-lg shadow-md p-6 border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Resume Preview</h2>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {analysisData.resumeText}
                </pre>
              </div>
            </div>
          </div>

          {/* Right Column - Analysis Results */}
          <div className="space-y-6">
            {/* Overall Score Card */}
            <div className="bg-card rounded-lg shadow-md p-6 border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Score</h2>
              <div className="text-center">
                <div className="text-4xl font-bold text-violet-600 mb-2">
                  {analysisData.overallScore}/100
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-violet-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${analysisData.overallScore}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">Resume Match Score</p>
              </div>
            </div>

            {/* Strengths Card */}
            <div className="bg-card rounded-lg shadow-md p-6 border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Strengths</h2>
              <ul className="space-y-2">
                {analysisData.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gaps Card */}
            <div className="bg-card rounded-lg shadow-md p-6 border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Areas for Improvement</h2>
              <ul className="space-y-2">
                {analysisData.gaps.map((gap, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-orange-500 mt-1">⚠</span>
                    <span className="text-gray-700">{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations Card */}
            <div className="bg-card rounded-lg shadow-md p-6 border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
              <ul className="space-y-2">
                {analysisData.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">💡</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ATS Score Card */}
            <div className="bg-card rounded-lg shadow-md p-6 border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">ATS Score</h2>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {analysisData.atsScore}/100
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${analysisData.atsScore}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">Applicant Tracking System Compatibility</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center">
          <button className="bg-violet-500 text-white px-6 py-3 rounded-lg hover:bg-violet-600 transition-colors mr-4">
            Download Analysis Report
          </button>
          <button className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors">
            Start New Analysis
          </button>
        </div>
      </div>
    </div>
  )
}