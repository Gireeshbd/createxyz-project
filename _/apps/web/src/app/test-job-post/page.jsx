"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import useUser from "@/utils/useUser";

export default function TestJobPostPage() {
  const { data: user, loading: userLoading } = useUser();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testJobPost = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log("User:", user);
      
      const testJobData = {
        title: "Test Job",
        description: "This is a test job posting",
        category: "Tech Help",
        location: "Test Location",
        duration: "1-2 hours",
        pay_type: "hourly",
        pay_amount: 25,
        urgent: false,
        poster_phone: "",
        requirements: ""
      };

      console.log("Posting job with data:", testJobData);
      
      const response = await api.jobs.create(testJobData);
      console.log("Success response:", response);
      setResult({ success: true, data: response });
      
    } catch (error) {
      console.error("Error posting job:", error);
      setResult({ success: false, error: error.message, fullError: error });
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    try {
      const { supabase } = await import('@/lib/supabase-client');
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Current session:", session);
      setResult({ success: true, session });
    } catch (error) {
      console.error("Auth test error:", error);
      setResult({ success: false, error: error.message });
    }
  };

  if (userLoading) {
    return <div className="p-8">Loading user...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Job Posting Debug Page</h1>
      
      <div className="space-y-4 mb-8">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Current User:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="space-x-4">
          <button
            onClick={testAuth}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Auth Session
          </button>
          
          <button
            onClick={testJobPost}
            disabled={loading || !user}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Job Post"}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}