"use client"

import { SignOutButton } from "@clerk/nextjs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/ui/header/index";
import { Button } from "@/components/ui/button";
import * as Strings from "@/components/ui/strings";

export interface Item {
  fileName: string;
  jobDescription: string;
  company: string;
  score: number;
  dateTime: Date;
}

export default function DashboardPage() {
  const router = useRouter()
  
  return (
    <>
      <Header/>
      <div className="container mx-auto px-2 flex justify-between pt-10">
        <div className="pb-6">
          <h1 className="text-3xl font-bold text-gray-800 pb-2">{Strings.dashboard}</h1>
          <p className="text-md">{Strings.dashboardDesc}</p>
        </div>
        <div>
          <Button className="md:inline-flex px-6 bg-violet-500">
            <Link href={"/dashboard/userform"}>
              {Strings.newAnalysis}</Link>
          </Button>
        </div>
      </div>
      <div className="container mx-auto flex">
        <main className="bg-gray-50 rounded-lg p-6 basis-1/5">
          <div className="container flex">
            <div className="py-2 pr-2">
              <svg className="w-7 h-7 text-violet-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 3v4a1 1 0 0 1-1 1H5m4 8h6m-6-4h6m4-8v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1Z"/>
              </svg>
            </div>
            <div>
              <div className="container flex">
                <p style={{ fontWeight: 'bold' }}> 
                  File Name
                </p>
              </div>
              <div className="container flex">
                <p className="text-sm"> 
                  Job Title -
                </p>
                <p className="text-sm pl-1"> 
                  Company Name
                </p>
              </div>
            </div>
          </div>
          <div className="container flex">
            <svg className="my-2 w-5 h-5 text-violet-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15v4m6-6v6m6-4v4m6-6v6M3 11l6-5 6 5 5.5-5.5"/>
            </svg>
            <p className="my-2 pl-2"> 
              Score
            </p>
            <p className="mt-2 pl-1"> 
              #
            </p>
              <svg className="mt-2 ml-4 w-6 h-6 text-violet-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z"/>
              </svg>
            <p className="mt-2 pl-2"> 
              ##/##/####
            </p>
          </div>
          <div className="container flex space-x-4">
            <Button className="border-2 md:inline-flex px-6 bg-violet-500 p-3">
              <Link href={"/dashboard/userform"}>
                {Strings.view}</Link>
            </Button>
            <Button className="border-2 md:inline-flex px-6 bg-transparent text-current p-3">
                {Strings.download}
            </Button>
            <Button className="md:inline-flex px-6 bg-transparent text-current shadow-none p-3">
                {Strings.deleteFeedback}
            </Button>
          </div>
        </main>
      </div>
    </>
  )
}

/*
      <SignOutButton>
        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
          Logout
        </button>
      </SignOutButton>
*/