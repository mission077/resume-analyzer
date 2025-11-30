"use client";

import ResumeForm from "@/components/userform/ResumeForm";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const UserFormPage = () => {
  // ✅ Changed to capital letter
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const onSubmit = async (formData: FormData) => {
    try {
      setIsLoading(true);

      // Set loading state in localStorage
      localStorage.setItem("resumeAnalysisLoading", "true");

      // Navigate to loading screen immediately
      router.push("/dashboard/analysis/loading");

      // Step 1: Extract text from file
      const extractResponse = await fetch("/api/resume/extract", {
        method: "POST",
        body: formData,
      });

      if (!extractResponse.ok) {
        throw new Error(`Extraction failed: ${extractResponse.status}`);
      }

      const extractData = await extractResponse.json();

      if (!extractData.success || !extractData.data?.resumeText) {
        throw new Error(
          extractData.error || "Failed to extract text from file"
        );
      }

      console.log("✅ Text extracted successfully");

      // Step 2: Analyze the extracted text
      const companyName = formData.get("companyName") as string;
      const jobTitle = formData.get("jobTitle") as string;
      const jobDescription = formData.get("jobDescription") as string;
      const fileName = (formData.get("resume") as File)?.name || "resume.pdf";

      const analyzeResponse = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: extractData.data.resumeText,
          companyName,
          jobTitle,
          jobDescription,
        }),
      });

      if (!analyzeResponse.ok) {
        throw new Error(`Analysis failed: ${analyzeResponse.status}`);
      }

      const analyzeData = await analyzeResponse.json();

      if (!analyzeData.success || !analyzeData.data?.analysis) {
        throw new Error(analyzeData.error || "Failed to analyze resume");
      }

      console.log("✅ Analysis completed successfully");

      // Step 3: Save to database
      const saveResponse = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          companyName,
          jobTitle,
          jobDescription,
          resumeText: extractData.data.resumeText,
          analysis: analyzeData.data.analysis,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error(`Failed to save analysis: ${saveResponse.status}`);
      }

      const saveData = await saveResponse.json();

      if (!saveData.success || !saveData.data?.id) {
        throw new Error("Failed to save analysis to database");
      }

      console.log("✅ Analysis saved to database with ID:", saveData.data.id);

      // Store the analysis ID in localStorage
      localStorage.setItem("currentAnalysisId", saveData.data.id.toString());

      // Store results in localStorage (for backward compatibility)
      localStorage.setItem(
        "analysisData",
        JSON.stringify({
          analysis: analyzeData.data.analysis,
          data: {
            companyName: analyzeData.data.companyName,
            jobTitle: analyzeData.data.jobTitle,
            jobDescription: analyzeData.data.jobDescription,
            resumeText: analyzeData.data.resumeText,
          },
        })
      );

      localStorage.setItem("resumeAnalysisLoading", "false");

      // Dispatch custom event for same-tab communication
      window.dispatchEvent(new CustomEvent("loadingComplete"));

      // Navigate to analysis page
      router.push("/dashboard/analysis");
    } catch (error) {
      console.error("Error processing resume:", error);
      localStorage.setItem("resumeAnalysisLoading", "false");
      router.push("/dashboard/userform");
    } finally {
      setIsLoading(false);
    }
  };

  return <ResumeForm onSubmit={onSubmit} isLoading={isLoading} />;
};

export default UserFormPage; // ✅ Export the component
