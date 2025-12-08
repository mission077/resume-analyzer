"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear any error state when component mounts (e.g., after logout)
  useEffect(() => {
    setError("");
  }, []);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Ensure cookies are sent and received
        redirect: "manual", // Don't automatically follow redirects
      });

      console.log("Login response status:", response.status, "StatusText:", response.statusText);
      console.log("Response ok:", response.ok);
      console.log("Response type:", response.type);

      // Check if response is a redirect (status 307/308 or opaqueredirect type) - this means success!
      // When using redirect: "manual", redirects appear as type "opaqueredirect" with status 0
      if (response.type === "opaqueredirect" || response.status === 307 || response.status === 308) {
        // Server is handling the redirect with cookie set, follow it
        // With opaqueredirect, we can't access headers, so use /dashboard as default
        let redirectUrl = "/dashboard";
        
        // Try to get Location header if available (only works for non-opaque redirects)
        if (response.type !== "opaqueredirect") {
          try {
            const location = response.headers.get("Location");
            console.log("Login redirect - Location header:", location);
            if (location) {
              // If Location is a full URL, extract the path, otherwise use as-is
              redirectUrl = location.startsWith("http") 
                ? new URL(location).pathname 
                : location;
            }
          } catch (e) {
            // If we can't parse the Location header, default to /dashboard
            console.log("Could not parse Location header, using /dashboard", e);
          }
        } else {
          console.log("Opaque redirect detected - using /dashboard as default");
        }
        
        // Clear any previous errors and redirect immediately
        setError("");
        console.log("Login successful, redirecting to:", redirectUrl);
        window.location.href = redirectUrl;
        return; // Exit early - page will reload on redirect
      }

      // If not a redirect, check for errors
      if (!response.ok && response.type !== "opaqueredirect") {
        console.log("Login failed - Status:", response.status, "StatusText:", response.statusText);
        // Handle different error status codes
        if (response.status === 0 && response.type !== "opaqueredirect") {
          // Network error or CORS issue (but not an opaque redirect)
          setError("Network error. Please check your connection and try again.");
        } else if (response.status >= 400 && response.status < 500) {
          // Client errors (401, 400, etc.)
          try {
            const data = await response.json();
            console.log("Login error data:", data);
            setError(data.error || "Invalid email or password");
          } catch (jsonError) {
            // If JSON parsing fails, use status text or a default message
            const errorMessage = response.statusText || "Invalid email or password";
            console.log("Could not parse error JSON:", jsonError);
            setError(`Login failed: ${errorMessage}`);
          }
        } else if (response.status >= 500) {
          // Server errors (500+)
          setError("Server error. Please try again later.");
        } else {
          // Unknown status code
          setError(`Unexpected error (status: ${response.status}). Please try again.`);
        }
        setIsLoading(false);
        return;
      }

      // If response is OK (200) but not a redirect, try to parse JSON
      try {
        const data = await response.json();
        if (data.message === "Login successful") {
          // Wait a moment for cookie to be set, then redirect
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 100);
        }
      } catch (jsonError) {
        // If JSON parsing fails but status is OK, assume success and redirect
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 100);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsLoading(false);
    } finally {
      // Only set loading to false if we haven't already done so
      // (redirects will cause a page reload, so state doesn't matter)
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("Google OAuth coming soon!");
  };

  const handleGithubSignIn = async () => {
    setError("GitHub OAuth coming soon!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-gray-800 hover:text-purple-600 transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="text-3xl font-bold">Resume Analyzer</span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-8">
          {/* Auth Tabs */}
          <div className="flex mb-8">
            <div className="flex-1 text-center">
              <button className="w-full py-2 px-4 bg-purple-500 text-white rounded-lg font-medium">
                Sign in
              </button>
            </div>
            <div className="flex-1 text-center">
              <Link
                href="/sign-up"
                className="w-full py-2 px-4 text-gray-600 hover:text-purple-600 transition-colors font-medium"
              >
                Create account
              </Link>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              Welcome back
            </h1>
            <p className="text-gray-600 text-lg">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-gray-700 font-semibold mb-3 text-base"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-base"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-gray-700 font-semibold mb-3 text-base"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-base"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Separator */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 font-medium">
                or continue with
              </span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="flex items-center justify-center space-x-2 bg-white border-2 border-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-50 hover:border-purple-300 transition-all duration-200"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a9.955 9.955 0 0 0-9.934 9.934 9.955 9.955 0 0 0 9.934 9.934c4.467 0 8.529-3.249 9.491-7.178h-.001z" />
              </svg>
              <span>Google</span>
            </button>

            <button
              onClick={handleGithubSignIn}
              type="button"
              className="flex items-center justify-center space-x-2 bg-white border-2 border-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-50 hover:border-purple-300 transition-all duration-200"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>
        </div>

        {/* Back to home link */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-purple-600 transition-colors font-medium text-lg"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
