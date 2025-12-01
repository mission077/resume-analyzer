"use client";

import { useState } from "react";
import { SubHeader } from "@/components/subHeader";

/**
 * Test Page for Resume API Routes
 * This page helps test POST, GET, PUT, DELETE operations
 */
export default function TestResumesPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test data
  const testResume = {
    title: "Test Resume - Software Engineer",
    personalInfo: {
      firstName: "John",
      lastName: "Doe",
      phone: "555-1234",
      email: "john@example.com",
      linkedin: "linkedin.com/in/johndoe",
      github: "github.com/johndoe",
    },
    education: [
      {
        school: "Test University",
        degree: "Bachelor's",
        field: "Computer Science",
        location: "City, State",
        graduationDate: "May 2025",
        gpa: "3.8/4.0",
      },
    ],
    experiences: [
      {
        company: "Test Company",
        role: "Software Engineer",
        startDate: "Jan 2023",
        endDate: "Dec 2024",
        isCurrent: false,
        location: "San Francisco, CA",
        description: [
          "Improved performance by **30%**",
          "Led team of **5 developers**",
        ],
      },
    ],
    projects: [
      {
        name: "Test Project",
        techStack: ["Python", "React", "AWS"],
        description: [
          "Built **full-stack** application",
          "Deployed on **AWS EC2**",
        ],
      },
    ],
    skills: {
      Languages: "Python, Javascript, C#",
      "Frameworks and Libraries": "React, Node.js, Express",
      "Development Tools": "Git, Docker, VS Code",
    },
    certifications: [],
    sourceType: "generated",
  };

  const testAPI = async (method: string, endpoint: string, body?: any) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(endpoint, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Test error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SubHeader />
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Test Resume API Routes
          </h1>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Make sure you're logged in! This page uses
              your browser's cookies for authentication.
            </p>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => testAPI("POST", "/api/resumes", testResume)}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? "Testing..." : "Test POST (Create Resume)"}
            </button>

            <button
              onClick={() => testAPI("GET", "/api/resumes")}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Testing..." : "Test GET (Get All Resumes)"}
            </button>

            <button
              onClick={() => {
                const id = prompt("Enter resume ID to fetch:");
                if (id) {
                  testAPI("GET", `/api/resumes/${id}`);
                }
              }}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? "Testing..." : "Test GET (Get One Resume)"}
            </button>

            <button
              onClick={() => {
                const id = prompt("Enter resume ID to delete:");
                if (id) {
                  testAPI("DELETE", `/api/resumes/${id}`);
                }
              }}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? "Testing..." : "Test DELETE (Delete Resume)"}
            </button>
          </div>

          {/* Results */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-red-900 mb-2">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">
                Success! Response:
              </h3>
              <pre className="text-sm text-green-800 overflow-auto bg-white p-4 rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Testing Instructions:
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                <strong>POST (Create):</strong> Click "Test POST" to create a
                new resume. Note the ID from the response.
              </li>
              <li>
                <strong>GET (All):</strong> Click "Test GET" to see all your
                resumes.
              </li>
              <li>
                <strong>GET (One):</strong> Click "Test GET (One)" and enter
                the resume ID from step 1.
              </li>
              <li>
                <strong>DELETE:</strong> Click "Test DELETE" and enter the
                resume ID to delete it.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}

