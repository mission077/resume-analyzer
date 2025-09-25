"use client"

import { SignOutButton } from "@clerk/nextjs"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
        <SignOutButton>
          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
            Logout
          </button>
        </SignOutButton>
        <div>
          <button className="bg-blue-500 rounded-2xl px-4 py-2 mt-4 hover:bg-pink-400">
            <Link href="/dashboard/userform">Go to Upload Resume Screen</Link>
          </button>
        </div>
      </div>
    </div>
  )
}
