"use client"

import ResumeForm from '@/components/userform/ResumeForm'
import React, { useState } from 'react'

const page = () => {
  const [isLoading, setIsLoading] = useState(false)
  const onSubmit = async (formData) => {
    // Do something with the form data
    // Handling the try catch block
    // Handling the loading state
    console.log("FormData received in parent")
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value)
    }

    // Send the form data to the back end
    const response = await fetch('/api/resume-builder', {
      method: 'POST',
      body: formData
    })
    console.log('Response received from back end:', response)
    
    const data = await response.json()
    console.log('Response data after sending to back end:', data)

  }
  return (
    <ResumeForm onSubmit={onSubmit} isLoading={isLoading}/>
  )
}

export default page
