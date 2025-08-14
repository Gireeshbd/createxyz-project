"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  FileText,
  MessageCircle,
  Star,
  TrendingUp,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit3,
  Trash2,
  Pause,
  Play,
  MoreVertical,
  Plus,
  Eye
} from "lucide-react";
import { api } from "@/lib/api-client";
import useUser from "@/utils/useUser";

export default function DashboardPage() {
  const { data: user, loading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedJob, setSelectedJob] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const queryClient = useQueryClient();

  // Helper functions
  const handleStatusChange = (job, newStatus) => {
    setSelectedJob(job);
    updateJobStatusMutation.mutate({ jobId: job.id, status: newStatus });
  };

  const handleDeleteJob = (job) => {
    setSelectedJob(job);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedJob) {
      deleteJobMutation.mutate(selectedJob.id);
      setShowDeleteModal(false);
      setSelectedJob(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Play size={14} />;
      case 'paused': return <Pause size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      case 'cancelled': return <AlertCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  // Redirect to login if not authenticated
  if (!userLoading && !user) {
    window.location.href = "/account/signin?callbackUrl=/dashboard";
    return null;
  }

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: () => api.users.dashboard(user.id),
    enabled: !!user?.id
  });

  // Fetch user's jobs
  const { data: myJobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["my-jobs", user?.id],
    queryFn: () => api.jobs.my(),
    enabled: !!user?.id,
  });

  // Fetch user's applications
  const { data: applicationsData } = useQuery({
    queryKey: ["applications"],
    queryFn: () => api.applications.list(),
    enabled: !!user
  });

  // Update job status mutation
  const updateJobStatusMutation = useMutation({
    mutationFn: ({ jobId, status }) => api.put(`/api/jobs/${jobId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(["my-jobs"]);
      queryClient.invalidateQueries(["dashboard"]);
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: (jobId) => api.delete(`/api/jobs/${jobId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["my-jobs"]);
      queryClient.invalidateQueries(["dashboard"]);
    },
  });

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6 w-1/4"></div>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-[#EAECF0] p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dashboard = dashboardData || {};
  const applications = applicationsData?.applications || [];

  const tabs = [
    { id: "overview", name: "Overview", icon: TrendingUp },
    { id: "jobs", name: "My Jobs", icon: Briefcase },
    { id: "applications", name: "Applications", icon: FileText },
    { id: "messages", name: "Messages", icon: MessageCircle }
  ];

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'accepted': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'withdrawn': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getApplicationStatusIcon = (status) => {
    switch (status) {
      case 'pending': return AlertCircle;
      case 'accepted': return CheckCircle;
      case 'rejected': return XCircle;
      default: return AlertCircle;
    }
  };

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
                <a href="/jobs" className="text-[#667085] hover:text-[#101828] transition-colors">Browse Jobs</a>
                <a href="/post-job" className="text-[#667085] hover:text-[#101828] transition-colors">Post a Job</a>
                <a href="/dashboard" className="text-blue-600 font-medium">Dashboard</a>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img
                  src={user?.image || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-[#101828]">{user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#101828] mb-2">Dashboard</h1>
          <p className="text-lg text-[#667085]">Manage your jobs, applications, and account</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-[#EAECF0] p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-[#667085]">Jobs Posted</div>
              <Briefcase size={20} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-[#101828]">
              {dashboard.statistics?.jobs?.total_posted || 0}
            </div>
            <div className="text-xs text-[#667085] mt-1">
              {dashboard.statistics?.jobs?.active || 0} active
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#EAECF0] p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-[#667085]">Applications</div>
              <FileText size={20} className="text-green-600" />
            </div>
            <div className="text-2xl font-bold text-[#101828]">
              {dashboard.statistics?.applications?.total_applied || 0}
            </div>
            <div className="text-xs text-[#667085] mt-1">
              {dashboard.statistics?.applications?.pending || 0} pending
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#EAECF0] p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-[#667085]">Rating</div>
              <Star size={20} className="text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-[#101828]">
              {dashboard.statistics?.ratings?.worker_rating || 'N/A'}
            </div>
            <div className="text-xs text-[#667085] mt-1">
              {dashboard.statistics?.ratings?.worker_review_count || 0} reviews
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#EAECF0] p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-[#667085]">Completion Rate</div>
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-[#101828]">
              {dashboard.statistics?.completion_rate || 0}%
            </div>
            <div className="text-xs text-[#667085] mt-1">
              {dashboard.statistics?.jobs?.completed || 0} completed
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-[#EAECF0]">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-[#667085] hover:text-[#101828] hover:border-gray-300'
                      }`}
                  >
                    <Icon size={16} className="mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-[#EAECF0]">
          {activeTab === "overview" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#101828] mb-6">Recent Activity</h2>

              {/* Recent Jobs */}
              {dashboard.recent_activity?.jobs?.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-[#101828] mb-4">Recent Jobs Posted</h3>
                  <div className="space-y-4">
                    {dashboard.recent_activity.jobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-[#101828]">{job.title}</h4>
                          <div className="flex items-center text-sm text-[#667085] mt-1">
                            <Calendar size={14} className="mr-1" />
                            {new Date(job.created_at).toLocaleDateString()}
                            <span className="mx-2">•</span>
                            <Users size={14} className="mr-1" />
                            {job.application_count} applications
                          </div>
                        </div>
                        <div className="text-sm font-medium text-[#101828] capitalize">
                          {job.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Applications */}
              {applications.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-[#101828] mb-4">Recent Applications</h3>
                  <div className="space-y-4">
                    {applications.slice(0, 3).map((application) => {
                      const StatusIcon = getStatusIcon(application.status);
                      return (
                        <div key={application.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-[#101828]">{application.job.title}</h4>
                            <div className="flex items-center text-sm text-[#667085] mt-1">
                              <MapPin size={14} className="mr-1" />
                              {application.job.category}
                              <span className="mx-2">•</span>
                              <DollarSign size={14} className="mr-1" />
                              {application.job.pay}
                            </div>
                          </div>
                          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                            <StatusIcon size={14} className="mr-1" />
                            {application.status}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(!dashboard.recent_activity?.jobs?.length && !applications.length) && (
                <div className="text-center py-12">
                  <Briefcase size={48} className="mx-auto text-[#9CA3AF] mb-4" />
                  <h3 className="text-lg font-medium text-[#101828] mb-2">No activity yet</h3>
                  <p className="text-[#667085] mb-6">Start by posting a job or applying to available positions</p>
                  <div className="flex justify-center space-x-4">
                    <a
                      href="/post-job"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Post a Job
                    </a>
                    <a
                      href="/jobs"
                      className="px-4 py-2 bg-white text-[#101828] border border-[#D0D5DD] rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Browse Jobs
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "jobs" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#101828]">My Jobs</h2>
                <a
                  href="/post-job"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Post New Job
                </a>
              </div>

              {dashboard.recent_activity?.jobs?.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.recent_activity.jobs.map((job) => (
                    <div key={job.id} className="border border-[#EAECF0] rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-[#101828] mb-2">{job.title}</h3>
                          <div className="flex items-center text-sm text-[#667085] space-x-4">
                            <div className="flex items-center">
                              <Calendar size={14} className="mr-1" />
                              Posted {new Date(job.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Users size={14} className="mr-1" />
                              {job.application_count} applications
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-[#101828] capitalize px-3 py-1 bg-gray-100 rounded-full">
                          {job.status}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <a
                          href={`/jobs/${job.id}`}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          View Job
                        </a>
                        <a
                          href={`/dashboard/jobs/${job.id}/applications`}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Manage Applications
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase size={48} className="mx-auto text-[#9CA3AF] mb-4" />
                  <h3 className="text-lg font-medium text-[#101828] mb-2">No jobs posted yet</h3>
                  <p className="text-[#667085] mb-6">Create your first job posting to get started</p>
                  <a
                    href="/post-job"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Post Your First Job
                  </a>
                </div>
              )}
            </div>
          )}

          {activeTab === "applications" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#101828] mb-6">My Applications</h2>

              {applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((application) => {
                    const StatusIcon = getApplicationStatusIcon(application.status);
                    return (
                      <div key={application.id} className="border border-[#EAECF0] rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-[#101828] mb-2">
                              {application.job.title}
                            </h3>
                            <div className="flex items-center text-sm text-[#667085] space-x-4 mb-2">
                              <div className="flex items-center">
                                <MapPin size={14} className="mr-1" />
                                {application.job.category}
                              </div>
                              <div className="flex items-center">
                                <DollarSign size={14} className="mr-1" />
                                {application.job.pay}
                              </div>
                              <div className="flex items-center">
                                <Calendar size={14} className="mr-1" />
                                Applied {new Date(application.applied_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-sm text-[#667085]">
                              Employer: {application.job.employer_name}
                            </div>
                          </div>
                          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getApplicationStatusColor(application.status)}`}>
                            <StatusIcon size={14} className="mr-1" />
                            {application.status}
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                          <a
                            href={`/jobs/${application.job_id}`}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            View Job
                          </a>
                          {application.status === 'accepted' && (
                            <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                              Start Conversation
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-[#9CA3AF] mb-4" />
                  <h3 className="text-lg font-medium text-[#101828] mb-2">No applications yet</h3>
                  <p className="text-[#667085] mb-6">Browse available jobs and submit your first application</p>
                  <a
                    href="/jobs"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Jobs
                  </a>
                </div>
              )}
            </div>
          )}

          {activeTab === "jobs" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#101828]">My Jobs</h2>
                <a
                  href="/post-job"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} className="mr-2" />
                  Post New Job
                </a>
              </div>

              {jobsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your jobs...</p>
                </div>
              ) : myJobsData?.jobs?.length > 0 ? (
                <div className="space-y-6">
                  {myJobsData.jobs.map((job) => (
                    <div
                      key={job.id}
                      className="border border-[#EAECF0] rounded-lg p-6 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-[#101828] mb-2">
                            {job.title}
                          </h3>
                          <p className="text-[#667085] mb-4 line-clamp-2">
                            {job.description}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center text-sm text-[#667085]">
                              <MapPin size={16} className="mr-2 text-gray-400" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center text-sm text-[#667085]">
                              <DollarSign size={16} className="mr-2 text-gray-400" />
                              <span>${job.pay_amount}/{job.pay_type}</span>
                            </div>
                            <div className="flex items-center text-sm text-[#667085]">
                              <Clock size={16} className="mr-2 text-gray-400" />
                              <span>{job.duration}</span>
                            </div>
                            <div className="flex items-center text-sm text-[#667085]">
                              <Calendar size={16} className="mr-2 text-gray-400" />
                              <span>{new Date(job.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 text-sm rounded-full font-medium flex items-center ${getStatusColor(job.status)}`}>
                              {getStatusIcon(job.status)}
                              <span className="ml-2 capitalize">{job.status}</span>
                            </span>
                            <span className="text-sm text-[#667085]">
                              {job.application_count || 0} applications
                            </span>
                            {job.urgent && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                                Urgent
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Job Actions */}
                        <div className="flex items-center space-x-2 ml-6">
                          {/* Status Management */}
                          <div className="flex items-center space-x-1">
                            {job.status === 'active' ? (
                              <button
                                onClick={() => handleStatusChange(job, 'paused')}
                                className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
                                title="Pause job"
                                disabled={updateJobStatusMutation.isPending}
                              >
                                <Pause size={18} />
                              </button>
                            ) : job.status === 'paused' ? (
                              <button
                                onClick={() => handleStatusChange(job, 'active')}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                title="Activate job"
                                disabled={updateJobStatusMutation.isPending}
                              >
                                <Play size={18} />
                              </button>
                            ) : null}

                            {(job.status === 'active' || job.status === 'paused') && (
                              <button
                                onClick={() => handleStatusChange(job, 'completed')}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Mark as completed"
                                disabled={updateJobStatusMutation.isPending}
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                          </div>

                          {/* View Job */}
                          <a
                            href={`/jobs/${job.id}`}
                            className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            title="View job details"
                          >
                            <Eye size={18} />
                          </a>

                          {/* Delete Job */}
                          <button
                            onClick={() => handleDeleteJob(job)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete job"
                            disabled={deleteJobMutation.isPending}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Briefcase size={64} className="mx-auto text-gray-300 mb-6" />
                  <h3 className="text-xl font-medium text-gray-900 mb-3">No jobs posted yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Start connecting with your local community by posting your first job.
                    Get help with tasks, projects, or services you need.
                  </p>
                  <a
                    href="/post-job"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Plus size={20} className="mr-2" />
                    Post Your First Job
                  </a>
                </div>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#101828] mb-6">Messages</h2>
              <div className="text-center py-12">
                <MessageCircle size={48} className="mx-auto text-[#9CA3AF] mb-4" />
                <h3 className="text-lg font-medium text-[#101828] mb-2">No messages yet</h3>
                <p className="text-[#667085]">Messages will appear here when you start conversations with employers or workers</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="bg-red-100 rounded-full p-2">
                  <AlertCircle size={20} className="text-red-600" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Job</h3>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-600">
                Are you sure you want to delete "{selectedJob?.title}"? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedJob(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={deleteJobMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                disabled={deleteJobMutation.isPending}
              >
                {deleteJobMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Deleting...
                  </div>
                ) : (
                  'Delete Job'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}