"use client";

import { useState } from "react";

export default function TestSimpleJobPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testSimpleJobPost = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const testJobData = {
        title: "Test Job Simple",
        description: "This is a test job posting via simple endpoint",
        category: "Tech Help",
        location: "Test Location",
        duration: "1-2 hours",
        pay_type: "hourly",
        pay_amount: 25
      };

      console.log("Posting to simple endpoint with data:", testJobData);
      
      const response = await fetch('/api/jobs-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testJobData)
      });

      const data = await response.json();
      console.log("Simple endpoint response:", data);
      setResult({ success: response.ok, data, status: response.status });
      
    } catch (error) {
      console.error("Error posting to simple endpoint:", error);
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Simple Job Posting Test</h1>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={testSimpleJobPost}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Simple Job Post (No Auth)"}
        </button>
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