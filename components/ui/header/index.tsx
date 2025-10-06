"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import * as Strings from "@/components/ui/strings";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

//This file contains the code for the header that is called in the landing page

export const Header = () => {
    const pathname = usePathname();

    const [showDashboard, setShowDashboard] = useState(false)
    const [showLogin, setShowLogin] = useState(false)
    const [showSignup, setShowSignup] = useState(false)
  

    useEffect(() => {
      if (pathname === "/") {
        setShowDashboard(true);
        setShowLogin(true);
        setShowSignup(true);
      }
    }, [pathname]);

    const router = useRouter()

    const handleDashboardClick = () => {
      router.push('/dashboard')
      setShowDashboard(false)
    }
    const handleLoginClick = () => {
      setShowLogin(false)
      router.push('/sign-in')
    }
    const handleSignupClick = () => {
      setShowSignup(false)
      router.push('/sign-up')
    }

    return (
      <header className="bg-gray-50 sticky top-0">
        <div className="container mx-auto flex justify-between py-4">
          <div className="py-2 font-bold">
                {Strings.appName}
          </div>
          {showDashboard && (
            <div className="py-2">
              <Link href="#features"
                className="py-2">{Strings.features}</Link>
              <Link href="#how-it-works"
                className="py-2 mx-4">{Strings.howItWorks}</Link>
              <button onClick={handleDashboardClick} className="active bg-trasparent p-0 text-current border-none shadow-none cursor-pointer focus:outline-none hover:bg-transparent hover:text-current">{Strings.dashboard}</button>
            </div>
          )}
          <div>
            {showDashboard && (
              <Link href={"/sign-in"}
                className="mr-4">{Strings.logIn}</Link>
            )}
            <Button className="hidden md:inline-flex bg-violet-500" onClick={handleSignupClick}>
              <svg className="w-6 h-6 text-gray-50 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2"/>
              </svg>
              {Strings.getStarted}
            </Button>
          </div>
        </div>
      </header>
    )
}