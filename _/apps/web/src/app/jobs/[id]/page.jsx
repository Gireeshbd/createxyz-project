"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Clock,
  DollarSign,
  Star,
  User,
  Briefcase,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  MessageCircle,
  Calendar,
  Users,
  Mail,
  Phone,
  Award,
  ThumbsUp,
  ThumbsDown,
  Eye,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { api } from "@/lib/api-client";
import useUser from "@/utils/useUser";

export default function JobDetailPage({ params }) {
  const { id } = params;
  const { data: user } = useUser();
  const queryClient = useQueryClient();

  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    message: "",
    hourly_rate: "",
    availability: "",
    experience: ""
  });
  const [activeTab, setActiveTab] = useState("details");
  const [expandedApplication, setExpandedApplication] = useState(null);

  // Fetch job details
  const { data: jobData, isLoading, error } = useQuery({
    queryKey: ["job", id],
    queryFn: () => api.jobs.get(id),
    enabled: !!id
  });

  // Fetch job applications (only if user owns the job)
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ["job-applications", id],
    queryFn: () => api.get(`/jobs/${id}/applications`),
    enabled: !!id && !!user && jobData?.job?.user_id === user.id
  });

  // Apply to job mutation
  const applyMutation = useMutation({
    mutationFn: (data) => api.jobs.apply(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      setShowApplicationForm(false);
      setApplicationData({
        message: "",
        hourly_rate: "",
        availability: "",
        experience: ""
      });
    }
  });

  // Update application status mutation
  const updateApplicationMutation = useMutation({
    mutationFn: ({ applicationId, status }) =>
      api.put(`/applications/${applicationId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications", id] });
      queryClient.invalidateQueries({ queryKey: ["job", id] });
    }
  });

  const job = jobData?.job;
  const applications = applicationsData?.applications || [];

  const handleApply = (e) => {
    e.preventDefault();
    if (!user) {
      window.location.href = `/account/signin?callbackUrl=/jobs/${id}`;
      return;
    }
    applyMutation.mutate(applicationData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplicationAction = (applicationId, status) => {
    updateApplicationMutation.mutate({ applicationId, status });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'accepted': return <UserCheck size={14} />;
      case 'rejected': return <UserX size={14} />;
      case 'withdrawn': return <ArrowLeft size={14} />;
      default: return <Clock size={14} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl border border-[#EAECF0] p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
            <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Job Not Found</h2>
            <p className="text-gray-600 mb-4">
              {error?.message || "The job you're looking for doesn't exist or has been removed."}
            </p>
            <a
              href="/jobs"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Jobs
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isOwnJob = user && job.user_id === user.id;
  const hasApplied = job.application_count > 0; // This would need to be more specific in real implementation

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-[#EAECF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="text-xl font-bold text-[#101828] mr-8">
                Uneven Jobs
              </a>
              <nav className="hidden md:flex space-x-6">
                <a href="/jobs" className="text-blue-600 font-medium">Browse Jobs</a>
                <a href="/post-job" className="text-[#667085] hover:text-[#101828] transition-colors">Post a Job</a>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-2">
                  <img
                    src={user.image || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium text-[#101828]">{user.name}</span>
                </div>
              ) : (
                <>
                  <a href="/account/signin" className="px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors">Sign In</a>
                  <a href="/account/signup" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Get Started</a>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <a
          href="/jobs"
          className="inline-flex items-center text-[#667085] hover:text-[#101828] transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Jobs
        </a>
      </div>

      {/* Job Details */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tab Navigation (only show for job owners) */}
            {isOwnJob && (
              <div className="bg-white rounded-t-xl border border-[#EAECF0] border-b-0 p-4">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "details"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                  >
                    <Briefcase size={16} className="inline mr-2" />
                    Job Details
                  </button>
                  <button
                    onClick={() => setActiveTab("applications")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "applications"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                  >
                    <Users size={16} className="inline mr-2" />
                    Applications ({applications.length})
                  </button>
                </div>
              </div>
            )}

            <div className={`bg-white border border-[#EAECF0] p-8 ${isOwnJob ? 'rounded-b-xl rounded-t-none' : 'rounded-xl'}`}>
              {/* Job Details Tab */}
              {(!isOwnJob || activeTab === "details") && (
                <>
                  {/* Job Header */}
                  <div className="mb-6">
                    {job.urgent && (
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-medium mb-4">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        Urgent
                      </div>
                    )}

                    <h1 className="text-3xl font-bold text-[#101828] mb-4">{job.title}</h1>

                    <div className="flex flex-wrap gap-4 text-sm text-[#667085] mb-4">
                      <div className="flex items-center">
                        <MapPin size={16} className="mr-2" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <Clock size={16} className="mr-2" />
                        {job.duration}
                      </div>
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2" />
                        {job.postedTime}
                      </div>
                    </div>

                    <div className="flex items-center text-2xl font-bold text-[#101828]">
                      <DollarSign size={24} className="mr-1" />
                      {job.pay}
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-[#101828] mb-4">Job Description</h2>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-[#667085] leading-relaxed whitespace-pre-wrap">
                        {job.description}
                      </p>
                    </div>
                  </div>

                  {/* Requirements */}
                  {job.requirements && (
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold text-[#101828] mb-4">Requirements</h2>
                      <div className="prose prose-gray max-w-none">
                        <p className="text-[#667085] leading-relaxed whitespace-pre-wrap">
                          {job.requirements}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Job Details */}
                  <div className="border-t border-[#EAECF0] pt-6">
                    <h2 className="text-xl font-semibold text-[#101828] mb-4">Job Details</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-[#667085] mb-1">Category</div>
                        <div className="font-medium text-[#101828]">{job.category}</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#667085] mb-1">Applications</div>
                        <div className="font-medium text-[#101828]">{job.application_count || 0} received</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#667085] mb-1">Job Status</div>
                        <div className="font-medium text-[#101828] capitalize">{job.status}</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#667085] mb-1">Job ID</div>
                        <div className="font-medium text-[#101828] font-mono text-sm">{job.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Applications Tab */}
              {isOwnJob && activeTab === "applications" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-[#101828]">Applications</h2>
                    <div className="text-sm text-[#667085]">
                      {applications.length} total applications
                    </div>
                  </div>

                  {applicationsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading applications...</p>
                    </div>
                  ) : applications.length > 0 ? (
                    <div className="space-y-6">
                      {applications.map((application) => (
                        <div
                          key={application.id}
                          className="border border-[#EAECF0] rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          {/* Application Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <img
                                src={application.profile.profile_image || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`}
                                alt={application.applicant_name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              <div>
                                <h3 className="font-semibold text-[#101828]">
                                  {application.applicant_name}
                                </h3>
                                <div className="flex items-center text-sm text-[#667085] space-x-3">
                                  <span className="flex items-center">
                                    <Star size={14} className="mr-1 fill-yellow-400 text-yellow-400" />
                                    {application.profile.worker_rating || 'New'}
                                    {application.profile.worker_review_count > 0 && ` (${application.profile.worker_review_count})`}
                                  </span>
                                  <span className="flex items-center">
                                    <Award size={14} className="mr-1" />
                                    {application.profile.total_jobs_completed || 0} jobs completed
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(application.status)}`}>
                                {getStatusIcon(application.status)}
                                <span className="ml-1 capitalize">{application.status}</span>
                              </span>

                              {application.status === 'pending' && (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleApplicationAction(application.id, 'accepted')}
                                    disabled={updateApplicationMutation.isPending}
                                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                                  >
                                    <ThumbsUp size={14} className="mr-1" />
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleApplicationAction(application.id, 'rejected')}
                                    disabled={updateApplicationMutation.isPending}
                                    className="flex items-center px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                                  >
                                    <ThumbsDown size={14} className="mr-1" />
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Application Details */}
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-[#667085] mb-1">Applied</div>
                              <div className="text-sm font-medium text-[#101828]">
                                {new Date(application.applied_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>

                            {application.hourly_rate && (
                              <div>
                                <div className="text-sm text-[#667085] mb-1">Proposed Rate</div>
                                <div className="text-sm font-medium text-[#101828]">
                                  ${application.hourly_rate}/hour
                                </div>
                              </div>
                            )}

                            {application.availability && (
                              <div>
                                <div className="text-sm text-[#667085] mb-1">Availability</div>
                                <div className="text-sm font-medium text-[#101828]">
                                  {application.availability}
                                </div>
                              </div>
                            )}

                            {application.profile.location && (
                              <div>
                                <div className="text-sm text-[#667085] mb-1">Location</div>
                                <div className="text-sm font-medium text-[#101828] flex items-center">
                                  <MapPin size={14} className="mr-1" />
                                  {application.profile.location}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Cover Message */}
                          {application.message && (
                            <div className="mb-4">
                              <div className="text-sm text-[#667085] mb-2">Cover Message</div>
                              <div className="bg-gray-50 rounded-lg p-3 text-sm text-[#101828]">
                                {application.message}
                              </div>
                            </div>
                          )}

                          {/* Experience */}
                          {application.experience && (
                            <div className="mb-4">
                              <div className="text-sm text-[#667085] mb-2">Relevant Experience</div>
                              <div className="bg-gray-50 rounded-lg p-3 text-sm text-[#101828]">
                                {application.experience}
                              </div>
                            </div>
                          )}

                          {/* Applicant Profile Details */}
                          <div className="border-t border-[#EAECF0] pt-4">
                            <button
                              onClick={() => setExpandedApplication(
                                expandedApplication === application.id ? null : application.id
                              )}
                              className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {expandedApplication === application.id ? (
                                <>
                                  <ChevronUp size={16} className="mr-1" />
                                  Hide Profile Details
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={16} className="mr-1" />
                                  View Profile Details
                                </>
                              )}
                            </button>

                            {expandedApplication === application.id && (
                              <div className="mt-4 space-y-3">
                                {application.profile.bio && (
                                  <div>
                                    <div className="text-sm text-[#667085] mb-1">Bio</div>
                                    <div className="text-sm text-[#101828]">{application.profile.bio}</div>
                                  </div>
                                )}

                                {application.profile.skills && application.profile.skills.length > 0 && (
                                  <div>
                                    <div className="text-sm text-[#667085] mb-2">Skills</div>
                                    <div className="flex flex-wrap gap-2">
                                      {application.profile.skills.map((skill, index) => (
                                        <span
                                          key={index}
                                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center space-x-4 text-sm">
                                  <a
                                    href={`mailto:${application.applicant_email}`}
                                    className="flex items-center text-blue-600 hover:text-blue-700"
                                  >
                                    <Mail size={14} className="mr-1" />
                                    Contact via Email
                                  </a>
                                  <button className="flex items-center text-blue-600 hover:text-blue-700">
                                    <MessageCircle size={14} className="mr-1" />
                                    Send Message
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users size={48} className="mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                      <p className="text-gray-600">
                        Applications will appear here when people apply for your job.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Employer Info */}
              <div className="bg-white rounded-xl border border-[#EAECF0] p-6 mb-6">
                <h3 className="text-lg font-semibold text-[#101828] mb-4">Posted By</h3>

                <div className="flex items-center mb-4">
                  <img
                    src={job.poster_profile_image || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`}
                    alt={job.poster_full_name || job.poster_name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-medium text-[#101828]">
                      {job.poster_full_name || job.poster_name}
                    </div>
                    <div className="flex items-center text-sm text-[#667085]">
                      <Star size={14} className="mr-1 fill-yellow-400 text-yellow-400" />
                      {job.employer_rating || 'New'}
                      {job.employer_review_count > 0 && ` (${job.employer_review_count} reviews)`}
                    </div>
                  </div>
                </div>

                {job.poster_bio && (
                  <p className="text-sm text-[#667085] mb-4">{job.poster_bio}</p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Jobs Posted:</span>
                    <span className="font-medium text-[#101828]">{job.total_jobs_posted || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Jobs Completed:</span>
                    <span className="font-medium text-[#101828]">{job.total_jobs_completed || 0}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl border border-[#EAECF0] p-6">
                {isOwnJob ? (
                  <div className="space-y-3">
                    <div className="text-sm text-[#667085] mb-2">This is your job posting</div>
                    <button
                      onClick={() => setActiveTab("applications")}
                      className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Users size={16} className="mr-2" />
                      View Applications ({applications.length})
                    </button>
                    <a
                      href="/dashboard"
                      className="w-full flex items-center justify-center px-4 py-3 bg-white text-[#101828] border border-[#D0D5DD] rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      <Briefcase size={16} className="mr-2" />
                      Back to Dashboard
                    </a>
                  </div>
                ) : job.status === 'active' ? (
                  <div className="space-y-3">
                    {!showApplicationForm ? (
                      <>
                        <button
                          onClick={() => {
                            if (!user) {
                              window.location.href = `/account/signin?callbackUrl=/jobs/${id}`;
                              return;
                            }
                            setShowApplicationForm(true);
                          }}
                          className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          <Briefcase size={16} className="mr-2" />
                          Apply Now
                        </button>

                        {user && (
                          <button className="w-full flex items-center justify-center px-4 py-3 bg-white text-[#101828] border border-[#D0D5DD] rounded-lg hover:bg-gray-50 transition-colors font-medium">
                            <MessageCircle size={16} className="mr-2" />
                            Message Employer
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        <h4 className="font-medium text-[#101828]">Apply for this job</h4>

                        <form onSubmit={handleApply} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-[#101828] mb-2">
                              Cover Message
                            </label>
                            <textarea
                              name="message"
                              value={applicationData.message}
                              onChange={handleInputChange}
                              rows={3}
                              placeholder="Tell the employer why you're perfect for this job..."
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                              required
                            />
                          </div>

                          {job.pay_type === 'hourly' && (
                            <div>
                              <label className="block text-sm font-medium text-[#101828] mb-2">
                                Your Hourly Rate ($)
                              </label>
                              <input
                                type="number"
                                name="hourly_rate"
                                value={applicationData.hourly_rate}
                                onChange={handleInputChange}
                                placeholder="25.00"
                                step="0.01"
                                min="0"
                                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-[#101828] mb-2">
                              Availability
                            </label>
                            <input
                              type="text"
                              name="availability"
                              value={applicationData.availability}
                              onChange={handleInputChange}
                              placeholder="e.g., Available weekends, flexible schedule"
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[#101828] mb-2">
                              Relevant Experience
                            </label>
                            <textarea
                              name="experience"
                              value={applicationData.experience}
                              onChange={handleInputChange}
                              rows={2}
                              placeholder="Brief description of your relevant experience..."
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            />
                          </div>

                          {applyMutation.error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-600 flex items-center">
                                <AlertCircle size={14} className="mr-2" />
                                {applyMutation.error.message}
                              </p>
                            </div>
                          )}

                          {applyMutation.isSuccess && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm text-green-600 flex items-center">
                                <CheckCircle size={14} className="mr-2" />
                                Application submitted successfully!
                              </p>
                            </div>
                          )}

                          <div className="flex space-x-3">
                            <button
                              type="submit"
                              disabled={applyMutation.isPending}
                              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                            >
                              {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowApplicationForm(false)}
                              className="px-4 py-2 bg-white text-[#101828] border border-[#D0D5DD] rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-sm text-[#667085] mb-2">
                      This job is {job.status}
                    </div>
                    <div className="text-xs text-[#9CA3AF]">
                      Applications are no longer being accepted
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}