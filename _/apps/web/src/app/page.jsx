"use client";

import { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Users,
  Star,
  ChevronRight,
  Filter,
  User,
  LogOut,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import useUser from "@/utils/useUser";
import { api } from "@/lib/api-client";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Get current user
  const { data: user, loading: userLoading } = useUser();

  // Fetch featured jobs from API
  const { data: jobsData, isLoading } = useQuery({
    queryKey: ["featured-jobs"],
    queryFn: async () => {
      return api.jobs.list({ limit: 3 });
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const featuredJobs = jobsData?.jobs || [];

  const jobCategories = [
    { id: "all", name: "All Categories", icon: Briefcase, count: 127 },
    { id: "Moving & Labor", name: "Moving & Labor", icon: Users, count: 23 },
    { id: "Pet Care", name: "Pet Care", icon: Users, count: 18 },
    { id: "Yard Work", name: "Yard Work", icon: Users, count: 31 },
    { id: "Cleaning", name: "Cleaning", icon: Users, count: 22 },
    { id: "Delivery", name: "Delivery", icon: Users, count: 15 },
    { id: "Tech Help", name: "Tech Help", icon: Users, count: 12 },
    { id: "Event Help", name: "Event Help", icon: Users, count: 6 },
    { id: "Handyman", name: "Handyman", icon: Users, count: 14 },
    { id: "Tutoring & Education", name: "Tutoring", icon: Users, count: 8 },
    { id: "Photography", name: "Photography", icon: Users, count: 5 },
    { id: "Cooking & Catering", name: "Cooking", icon: Users, count: 7 },
  ];

  // Keyboard shortcuts for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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

      <p className="text-[#667085] text-sm mb-4 line-clamp-2">
        {job.description}
      </p>

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
            src={
              job.poster_avatar ||
              `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`
            }
            alt={job.poster_name}
            className="w-8 h-8 rounded-full object-cover mr-3"
          />
          <div>
            <div className="text-sm font-medium text-[#101828]">
              {job.poster_name}
            </div>
            <div className="flex items-center text-xs text-[#667085]">
              <Star
                size={12}
                className="mr-1 fill-yellow-400 text-yellow-400"
              />
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

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-[#EAECF0] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-[#101828]">Uneven Jobs</h1>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center px-3 py-2 text-sm text-[#667085] bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Search size={16} className="mr-2" />
                Search jobs...
                <span className="ml-2 text-xs text-[#9CA3AF]">⌘K</span>
              </button>
              <a
                href="/jobs"
                className="text-[#667085] hover:text-[#101828] transition-colors"
              >
                Browse Jobs
              </a>

              {userLoading ? (
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              ) : user ? (
                <div className="flex items-center space-x-4">
                  <a
                    href="/post-job"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Post a Job
                  </a>
                  <div className="relative group">
                    <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <img
                        src={
                          user.image ||
                          `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`
                        }
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-[#101828]">
                        {user.name}
                      </span>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[#EAECF0] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="p-2">
                        <a
                          href="/dashboard"
                          className="flex items-center px-3 py-2 text-sm text-[#101828] hover:bg-gray-50 rounded-lg"
                        >
                          <User size={16} className="mr-2" />
                          Dashboard
                        </a>
                        <a
                          href="/account/logout"
                          className="flex items-center px-3 py-2 text-sm text-[#101828] hover:bg-gray-50 rounded-lg"
                        >
                          <LogOut size={16} className="mr-2" />
                          Sign Out
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <a
                    href="/account/signin"
                    className="px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Sign In
                  </a>
                  <a
                    href="/account/signup"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-[#101828] mb-6">
            Find Local Help.
            <br />
            <span className="text-blue-600">Get Things Done.</span>
          </h1>
          <p className="text-xl text-[#667085] mb-10 max-w-2xl mx-auto">
            Connect with your neighbors for quick jobs, errands, and tasks. From
            moving furniture to dog walking, find trusted help in your area.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <a
              href="/jobs"
              className="flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <Briefcase size={20} className="mr-2" />
              Find Work
            </a>
            <a
              href={
                user ? "/post-job" : "/account/signup?callbackUrl=/post-job"
              }
              className="flex items-center justify-center px-8 py-4 bg-white text-[#101828] border border-[#D0D5DD] rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              <Users size={20} className="mr-2" />
              Post a Job
            </a>
          </div>
        </div>
      </section>

      {/* Job Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#101828] mb-4">
              Browse by Category
            </h2>
            <p className="text-lg text-[#667085]">
              Find the perfect job that matches your skills
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {jobCategories.slice(1).map((category) => (
              <a
                key={category.id}
                href={`/jobs?category=${encodeURIComponent(category.id)}`}
                className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left group block"
              >
                <category.icon size={24} className="text-blue-600 mb-3" />
                <h3 className="font-medium text-[#101828] mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-[#667085]">
                  {category.count} jobs available
                </p>
                <ChevronRight
                  size={16}
                  className="text-[#667085] mt-2 group-hover:translate-x-1 transition-transform"
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#101828] mb-2">
                Jobs Near You
              </h2>
              <p className="text-lg text-[#667085]">
                Fresh opportunities in your neighborhood
              </p>
            </div>
            <a
              href="/jobs"
              className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All
              <ChevronRight size={16} className="ml-1" />
            </a>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-[#EAECF0] p-6 animate-pulse"
                >
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
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-[#101828] mb-4">
            Trusted by Your Community
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                2,500+
              </div>
              <div className="text-[#667085]">Jobs Completed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">4.9★</div>
              <div className="text-[#667085]">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                1,200+
              </div>
              <div className="text-[#667085]">Active Helpers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-0 z-50 mt-6 sm:mt-0">
          <div className="w-[90%] sm:w-[480px] md:w-[600px] max-h-[80vh] rounded-xl bg-white shadow-xl border border-[#EAECF0] flex flex-col">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#EAECF0]">
              <Search size={20} className="text-[#9CA3AF]" strokeWidth={2} />
              <input
                type="text"
                placeholder="Search for jobs, skills, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-base sm:text-lg placeholder-[#9CA3AF] outline-none font-normal"
                autoFocus
              />
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md border border-[#D1D5DB] text-[#9CA3AF] text-xs">
                <span>ESC</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {featuredJobs
                  .filter(
                    (job) =>
                      job.title
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      job.category
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      job.location
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                  )
                  .map((job) => (
                    <div
                      key={job.id}
                      className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="font-medium text-[#101828]">
                        {job.title}
                      </div>
                      <div className="text-sm text-[#667085]">
                        {job.category} • {job.location}
                      </div>
                    </div>
                  ))}

                {searchQuery &&
                  featuredJobs.filter(
                    (job) =>
                      job.title
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      job.category
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      job.location
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                  ).length === 0 && (
                    <div className="text-center py-8 text-[#667085]">
                      No jobs found for "{searchQuery}"
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close search */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsSearchOpen(false)}
        />
      )}
    </div>
  );
}
