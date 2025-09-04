"use client"

import { SignOutButton } from "@clerk/nextjs"

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
        <SignOutButton>
          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
            Logout
          </button>
        </SignOutButton>
      </div>
    </div>
  )
}