"use client";

import { useEffect } from "react";
import useAuth from "@/utils/useAuth";
import { Briefcase, LogOut } from "lucide-react";

export default function LogoutPage() {
  const { signOut } = useAuth();

  useEffect(() => {
    // Auto sign out when page loads
    const handleSignOut = async () => {
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    };

    handleSignOut();
  }, [signOut]);

  const handleManualSignOut = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
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

      {/* Sign Out Confirmation */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border border-[#EAECF0] p-8 shadow-sm text-center">
            <div className="mb-6">
              <LogOut size={48} className="text-blue-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-[#101828] mb-2">Sign Out</h1>
              <p className="text-[#667085]">Are you sure you want to sign out of your account?</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleManualSignOut}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Yes, Sign Out
              </button>
              
              <a
                href="/"
                className="w-full block text-center py-3 border border-[#D0D5DD] rounded-lg hover:bg-gray-50 transition-colors font-medium text-[#101828]"
              >
                Cancel
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}