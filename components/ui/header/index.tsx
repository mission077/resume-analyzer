"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import * as Strings from "@/components/ui/strings";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

//This file contains the code for the header that is called in the landing page

export const Header = () => {
  const pathname = usePathname();

  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (pathname === "/") {
      setShowLogin(true);
      setShowSignup(true);
      setIsAuthenticated(false);
    } else if (pathname.startsWith("/dashboard")) {
      // User is on dashboard - show logout
      setShowLogin(false);
      setShowSignup(false);
      setIsAuthenticated(true);
    }
  }, [pathname]);

  const router = useRouter();

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  const handleLoginClick = () => {
    setShowLogin(false);
    router.push("/sign-in");
  };
  const handleSignupClick = () => {
    setShowSignup(false);
    router.push("/sign-up");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Use window.location for hard redirect to ensure cookie is cleared
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="bg-gray-50 sticky top-0">
      <div className="container mx-auto flex justify-between items-center py-3">
        <div className="font-bold">{Strings.appName}</div>
        {pathname === "/" && (
          <div className="flex items-center gap-12">
            <a 
              href="#features" 
              onClick={(e) => handleSmoothScroll(e, "features")}
              className="cursor-pointer hover:text-violet-600 transition-colors text-base font-medium px-2"
            >
              {Strings.features}
            </a>
            <a 
              href="#how-it-works" 
              onClick={(e) => handleSmoothScroll(e, "how-it-works")}
              className="cursor-pointer hover:text-violet-600 transition-colors text-base font-medium px-2"
            >
              {Strings.howItWorks}
            </a>
          </div>
        )}
        <div className="flex items-center gap-4">
          {pathname === "/" && (
            <Link href={"/sign-in"} className="mr-4 hover:text-violet-600 transition-colors">
              {Strings.logIn}
            </Link>
          )}
          <Button
            className="hidden md:inline-flex bg-violet-500"
            onClick={handleSignupClick}
          >
            <svg
              className="w-6 h-6 text-gray-50 dark:text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2"
              />
            </svg>
            {Strings.getStarted}
          </Button>
          {isAuthenticated && (
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={handleLogout}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
