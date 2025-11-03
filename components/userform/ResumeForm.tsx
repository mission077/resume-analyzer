"use client";

import { Header } from "@/components/ui/header/index";
import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from "@/components/ui/button"

interface ResumeFormProps {
  onSubmit: (formData: FormData) => void;
  isLoading: boolean;
}

const ResumeForm = ({ onSubmit, isLoading }: ResumeFormProps) => {
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => {
        setIsMounted(true)
    }, [])
    const [resume, setResume] = useState<File | null>(null)
    const [fileError, setFileError] = useState<string | null>(null)

    const [companyName, setCompanyName] = useState<string>("")
    const [jobTitle, setJobTitle] = useState<string>("")
    const [jobDescription, setJobDescription] = useState<string>("")
    const [formError, setFormError] = useState<Record<string, string>>({})

    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Handling Edge Cases 
        const file = acceptedFiles[0]

        // Check if file is a PDF or Docx
        if (file.type !== "application/pdf" && file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            setFileError("Please upload a PDF or Docx file")
            return;
        }

        // Check if file size is less than 10MB
        if (file.size > 10 * 1024 * 1024) {
            setFileError("File size must be less than 10MB")
            return;
        }

        // If every validation passes , we can set the resume state
        setFileError("")
        console.log(acceptedFiles)
        setResume(file)
    }, [])

    const validateForm = () => {
        const errors = {}

        console.log("Validating:", { companyName, jobTitle, jobDescription, resume })

        if (!companyName) errors["companyName"] = "Company name is required"
        if (!jobTitle) errors["jobTitle"] = "Job title is required"
        if (!jobDescription) errors["jobDescription"] = "Job description is required"
        if (!resume) errors["resume"] = "Resume is required"

        console.log("Errors found:", errors)
        setFormError(errors)
        
        // Failed if there are errors, Valid if there are no erros
        return Object.keys(errors).length === 0
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault() // Prevent the form from refreshing page

        console.log("Form submitted")
        if (!validateForm()) {
            console.log("Form validation failed")
            return;
        }

        console.log("Form validation passed")
        const formData = new FormData()
        formData.append("companyName", companyName)
        formData.append("jobTitle", jobTitle)
        formData.append("jobDescription", jobDescription)
        formData.append("resume", resume)

        // Send the valid form data to the parent component
        onSubmit(formData)
    }

    // React-Dropzone props
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})
    
    if (!isMounted) {
        return null
    }

    return (
    <>
        <Header/>
        <form suppressHydrationWarning onSubmit={handleSubmit}>
            <div className="container mx-auto px-2 flex gap-4 pt-10 pb-6">
                <main className="bg-gray-50 rounded-lg basis-1/2 p-8">
                    <section className='flex items-center justify-center p-4'>
                        <div className='w-full'>
                            <div>
                                <h1 className="text-xl" style={{ fontWeight: 'bold' }}>
                                    Upload your resume
                                </h1>
                                <p className="text-md my-2">PDF or DOCX</p>
                            </div>

                            {/* Drag and Drop Resume Zone */}
                            <div>
                                <div {...getRootProps()} className='flex items-center bg-white rounded-2xl p-2 border-2 border-dotted mt-2 hover:cursor-pointer pt-15 pb-15 text-gray-500'>
                                    <input suppressHydrationWarning {...getInputProps()} />
                                    {isDragActive ? (
                                        resume ? (
                                            <p>Drop to replace the current resume</p>
                                        ) : (
                                            <p>Drop the files here...</p>
                                        )
                                    ) : (
                                        resume ? (
                                            <div>
                                                <p>{resume.name}</p>
                                                <p>{Math.round(resume.size / 1024)} KB</p>
                                            </div>
                                        ) : (
                                            <div className="w-full flex items-center justify-center h-full flex-col">
                                                <svg className="w-9 h-9 text-gray-500 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"/>
                                                </svg>
                                                <p> Drag "n" drop some files here, or click to select files</p>
                                            </div>
                                        )
                                    )}
                                </div>
                                {/* Displaying the error message if user upload invalid file */}
                                {fileError && (
                                    <p className="text-red-500 mt-2">{fileError}</p>
                                )}
                                {/* Displaying error message if resume is missing */}
                                {formError["resume"] && (
                                    <p className="text-red-500 mt-2">{formError["resume"]}</p>
                                )}
                            </div>
                        </div>
                    </section>
                </main>
                <main className="bg-gray-50 rounded-lg basis-1/2 p-8">
                    <h1 className="text-xl" style={{ fontWeight: 'bold' }}>
                        Job details
                    </h1> 

                    {/* Company Name */}
                    <div className="pt-6">
                        <label>Company Name</label>
                        <input 
                            id="companyName"
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Your Company Name"
                            className='w-full bg-white rounded-2xl p-2 border-2 mt-2' 
                        />
                        {formError["companyName"] && (
                            <p className="text-red-500 mt-1">{formError["companyName"]}</p>
                        )}
                    </div>

                    {/* Job Title */}
                    <div className="pt-4">
                        <label>Job Title</label>
                        <input 
                            id="jobTitle"
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="Your job title"
                            className='w-full bg-white rounded-2xl p-2 border-2 mt-2' 
                        />
                        {formError["jobTitle"] && (
                            <p className="text-red-500 mt-1">{formError["jobTitle"]}</p>
                        )}
                    </div>

                    {/* Job Description */}
                    <div className="pt-4">
                        <label>Job Description</label>
                        <textarea 
                            id="jobDescription"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Copy your job description here or write a clear and concise responsibility and expectations"
                            className='w-full bg-white rounded-2xl p-2 border-2 mt-2 pb-30' 
                        />
                        {formError["jobDescription"] && (
                            <p className="text-red-500 mt-1">{formError["jobDescription"]}</p>
                        )}
                    </div>

                    {/* Submit Form Button */}
                    <div className="pt-8">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className='mt-3 bg-violet-500 md:inline-flex'>
                            {isLoading ? "Analyzing Resume..." : "Submit"}
                        </Button>
                    </div>
                </main>
            </div>
        </form>
    </>
  )
}

export default ResumeForm
