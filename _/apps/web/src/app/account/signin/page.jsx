"use client";

import { useState } from "react";
import useAuth from "@/utils/useAuth";
import { Briefcase, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { signInWithCredentials, signInWithGoogle } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const result = await signInWithCredentials({
        email,
        password,
        callbackUrl: "/",
        redirect: false, // Handle redirect manually
      });

      if (result.error) {
        // Handle Supabase-specific errors
        const errorMessages = {
          "Invalid login credentials": "Invalid email or password. Please try again.",
          "Email not confirmed": "Please check your email and confirm your account.",
          "Too many requests": "Too many sign-in attempts. Please try again later.",
          "Invalid email": "Please enter a valid email address.",
        };

        setError(errorMessages[result.error.message] || result.error.message || "Something went wrong. Please try again.");
        setLoading(false);
      } else {
        // Success - redirect to home
        console.log("Sign in successful:", result.data);
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signInWithGoogle({
        callbackUrl: "/"
      });
      
      if (result.error) {
        console.error("Google OAuth error:", result.error);
        
        // Handle specific Google OAuth errors
        if (result.error.message?.includes('Provider not found')) {
          setError("Google sign-in is not configured. Please contact support.");
        } else if (result.error.message?.includes('Invalid redirect')) {
          setError("Configuration error. Please try again or contact support.");
        } else {
          setError(result.error.message || "Google sign in failed. Please try again.");
        }
        setLoading(false);
      }
      // If successful, the user will be redirected automatically
    } catch (error) {
      console.error("Unexpected Google OAuth error:", error);
      setError("Google sign in failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-[#EAECF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center">
              <Briefcase size={24} className="text-blue-600 mr-2" />
              <span className="text-xl font-bold text-[#101828]">Uneven Jobs</span>
            </a>
          </div>
        </div>
      </header>

      {/* Sign In Form */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border border-[#EAECF0] p-8 shadow-sm">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[#101828] mb-2">Welcome Back</h1>
              <p className="text-[#667085]">Sign in to your Uneven Jobs account</p>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-[#D0D5DD] rounded-lg hover:bg-gray-50 transition-colors mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img 
                src="https://developers.google.com/identity/images/g-logo.png" 
                alt="Google" 
                className="w-5 h-5 mr-3"
              />
              <span className="text-[#101828] font-medium">
                {loading ? "Redirecting..." : "Continue with Google"}
              </span>
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#EAECF0]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#667085]">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#101828] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-[#101828] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF] hover:text-[#667085]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Forgot Password Link */}
              <div className="text-right">
                <a
                  href="/account/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot your password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-[#667085]">
                Don't have an account?{" "}
                <a
                  href={`/account/signup${typeof window !== "undefined" ? window.location.search : ""}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign up for free
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}