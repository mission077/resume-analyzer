"use client";

import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'

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
    <section className='min-h-screen flex items-center justify-center p-4'>
        <div className='w-full max-w-md'>
            <form suppressHydrationWarning onSubmit={handleSubmit}>
                {/* Company Name */}
                <div>
                    <label>Company Name</label>
                    <input 
                        id="companyName"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Your Company Name"
                        className='w-full bg-white rounded-2xl p-2 border-2 border-white/30 mt-2' 
                    />
                    {formError["companyName"] && (
                        <p>{formError["companyName"]}</p>
                    )}
                </div>

                {/* Job Title */}
                <div>
                    <label>Job Title</label>
                    <input 
                        id="jobTitle"
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Your job title"
                        className='w-full bg-white rounded-2xl p-2 border-2 border-white/30 mt-2' 
                    />
                    {formError["jobTitle"] && (
                        <p>{formError["jobTitle"]}</p>
                    )}
                </div>

                {/* Job Description */}
                <div>
                    <label>Job Description</label>
                    <textarea 
                        id="jobDescription"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Copy your job description here or write a clear and concise responsibility and expectations"
                        className='w-full bg-white rounded-2xl p-2 border-2 border-white/30 mt-2' 
                    />
                    {formError["jobDescription"] && (
                        <p>{formError["jobDescription"]}</p>
                    )}
                </div>

                {/* Drag and Drop Resume Zone */}
                <div>
                    <div {...getRootProps()} className='w-full bg-white rounded-2xl p-2 border-2 border-white/30 mt-2 hover:cursor-pointer'>
                        {/* If user has already uploaded a resume, show the file name */}
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
                                <p>Drag "n" drop some files here, or click to select files</p>
                            )
                        )}
                    </div>
                    {/* Displaying the error message if user upload invalid file */}
                    {fileError && (
                        <p>{fileError}</p>
                    )}
                    {/* Displaying error message if resume is missing */}
                    {formError["resume"] && (
                        <p>{formError["resume"]}</p>
                    )}
                </div>

                {/* Submit Form Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className='bg-white mt-3 hover:cursor-pointer'
                >
                    {isLoading ? "Analyzing Resume..." : "Submit"}
                </button>
            </form>
        </div>
    </section>
  )
}

export default ResumeForm
