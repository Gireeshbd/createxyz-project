"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Clock, DollarSign, Star, Filter, ChevronDown, Briefcase, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);

  const jobCategories = [
    { id: "all", name: "All Categories", icon: Briefcase },
    { id: "Moving & Labor", name: "Moving & Labor", icon: Users },
    { id: "Pet Care", name: "Pet Care", icon: Users },
    { id: "Yard Work", name: "Yard Work", icon: Users },
    { id: "Cleaning", name: "Cleaning", icon: Users },
    { id: "Delivery", name: "Delivery", icon: Users },
    { id: "Tech Help", name: "Tech Help", icon: Users },
    { id: "Event Help", name: "Event Help", icon: Users }
  ];

  // Fetch jobs using React Query
  const {
    data: jobsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["jobs", selectedCategory, searchQuery, urgentOnly],
    queryFn: async () => {
      const params = {};
      if (selectedCategory !== "all") params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      if (urgentOnly) params.urgent = "true";
      
      return api.jobs.list(params);
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const jobs = jobsData?.jobs || [];

  const JobCard = ({ job }) => (
    <a href={`/jobs/${job.id}`} className="group bg-white rounded-xl border border-[#EAECF0] p-6 hover:shadow-lg hover:border-[#D0D5DD] transition-all cursor-pointer block">
      {job.urgent && (
        <div className="inline-flex items-center px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium mb-3">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></div>
          Urgent
        </div>
      )}
      
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-[#101828] group-hover:text-blue-600 transition-colors">
          {job.title}
        </h3>
        <div className="text-sm text-[#667085]">{job.postedTime}</div>
      </div>
      
      <p className="text-[#667085] text-sm mb-4 line-clamp-3">{job.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
          {job.category}
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-[#667085]">
          <MapPin size={14} className="mr-2" />
          {job.location}
        </div>
        <div className="flex items-center text-sm text-[#667085]">
          <Clock size={14} className="mr-2" />
          {job.duration}
        </div>
        <div className="flex items-center text-sm font-medium text-[#101828]">
          <DollarSign size={14} className="mr-2" />
          {job.pay}
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-[#EAECF0]">
        <div className="flex items-center">
          <img
            src={job.poster_avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`}
            alt={job.poster_name}
            className="w-8 h-8 rounded-full object-cover mr-3"
          />
          <div>
            <div className="text-sm font-medium text-[#101828]">{job.poster_name}</div>
            <div className="flex items-center text-xs text-[#667085]">
              <Star size={12} className="mr-1 fill-yellow-400 text-yellow-400" />
              {job.poster_rating || 4.5}
            </div>
          </div>
        </div>
        <span className="text-blue-600 text-sm font-medium group-hover:text-blue-700 transition-colors">
          View Details
        </span>
      </div>
    </a>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Jobs</h2>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-[#EAECF0] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="text-xl font-bold text-[#101828] mr-8">Uneven Jobs</a>
              <nav className="hidden md:flex space-x-6">
                <a href="/jobs" className="text-blue-600 font-medium">Browse Jobs</a>
                <a href="/post-job" className="text-[#667085] hover:text-[#101828] transition-colors">Post a Job</a>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors">Sign In</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <section className="bg-white border-b border-[#EAECF0] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search for jobs, skills, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-white border border-[#D1D5DB] rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {jobCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
            </div>

            {/* Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={16} className="mr-2" />
              Filters
            </button>
          </div>

          {/* Additional Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={urgentOnly}
                    onChange={(e) => setUrgentOnly(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-[#667085]">Urgent jobs only</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Jobs List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#101828] mb-2">
                {selectedCategory === "all" ? "All Jobs" : selectedCategory}
              </h1>
              <p className="text-lg text-[#667085]">
                {isLoading ? "Loading..." : `${jobs.length} jobs found`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-[#EAECF0] p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-full"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                  <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-[#9CA3AF] mb-4">
                <Briefcase size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-[#101828] mb-2">No jobs found</h3>
              <p className="text-[#667085]">
                Try adjusting your search criteria or browse different categories.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}