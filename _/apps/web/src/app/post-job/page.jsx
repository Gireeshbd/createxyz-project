"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useUser from "@/utils/useUser";
import { api } from "@/lib/api-client";
import LocationPicker from "@/components/LocationPicker";

export default function PostJobPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    customCategory: "",
    location: "",
    duration: "",
    pay_type: "hourly",
    pay_amount: "",
    urgent: false,
    poster_phone: "",
    requirements: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const queryClient = useQueryClient();

  // Get current user - always call hooks at top level
  const { data: user, loading: userLoading } = useUser();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin?callbackUrl=/post-job";
    }
  }, [user, userLoading]);

  const jobCategories = [
    "Moving & Labor",
    "Pet Care",
    "Yard Work",
    "Cleaning",
    "Delivery",
    "Tech Help",
    "Event Help",
    "Handyman",
    "Childcare",
    "Errands",
    "Tutoring & Education",
    "Photography",
    "Cooking & Catering",
    "Home Repair",
    "Painting",
    "Furniture Assembly",
    "Car Wash & Detailing",
    "Shopping & Grocery",
    "Administrative Tasks",
    "Social Media Help",
    "Writing & Translation",
    "Fitness & Personal Training",
    "Music Lessons",
    "Art & Crafts",
    "Other"
  ];

  const createJobMutation = useMutation({
    mutationFn: async (jobData) => {
      return api.jobs.create({
        ...jobData,
        poster_name: user.name,
        poster_email: user.email,
      });
    },
    onSuccess: () => {
      // Invalidate jobs query to refresh the job listings
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setIsSubmitted(true);
      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        customCategory: "",
        location: "",
        duration: "",
        pay_type: "hourly",
        pay_amount: "",
        urgent: false,
        poster_phone: "",
        requirements: "",
      });
      setShowCustomCategory(false);
      setErrors({});
    },
    onError: (error) => {
      console.error("Error posting job:", error);
      setErrors({ submit: error.message });
    },
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle category selection
    if (name === "category") {
      setShowCustomCategory(value === "Other");
      if (value !== "Other") {
        setFormData((prev) => ({ ...prev, customCategory: "" }));
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    console.log('Validating form with data:', formData);

    if (!formData.title.trim()) newErrors.title = "Job title is required";
    if (!formData.description.trim())
      newErrors.description = "Job description is required";
    if (!formData.category) newErrors.category = "Please select a category";
    if (formData.category === "Other" && !formData.customCategory.trim())
      newErrors.customCategory = "Please specify the category";
    if (!formData.location.trim()) {
      console.log('Location validation failed. Location value:', `"${formData.location}"`);
      newErrors.location = "Location is required";
    }
    if (!formData.duration.trim()) newErrors.duration = "Duration is required";
    if (!formData.pay_amount || formData.pay_amount <= 0)
      newErrors.pay_amount = "Please enter a valid pay amount";

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const submitData = {
        ...formData,
        category: formData.category === "Other" ? formData.customCategory : formData.category,
        pay_amount: parseFloat(formData.pay_amount),
      };

      // Remove customCategory from submit data
      delete submitData.customCategory;

      createJobMutation.mutate(submitData);
    }
  };

  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-[#667085]">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter">
        <header className="bg-white border-b border-[#EAECF0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <a href="/" className="text-xl font-bold text-[#101828]">
                Uneven Jobs
              </a>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-xl border border-[#EAECF0] p-8">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-[#101828] mb-4">
              Job Posted Successfully!
            </h1>
            <p className="text-lg text-[#667085] mb-8">
              Your job has been posted and is now visible to job seekers in your
              area. You'll receive applications via email.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/jobs"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View All Jobs
              </a>
              <button
                onClick={() => setIsSubmitted(false)}
                className="px-6 py-3 bg-white text-[#101828] border border-[#D0D5DD] rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Post Another Job
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                <a
                  href="/jobs"
                  className="text-[#667085] hover:text-[#101828] transition-colors"
                >
                  Browse Jobs
                </a>
                <a href="/post-job" className="text-blue-600 font-medium">
                  Post a Job
                </a>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
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
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-[#EAECF0] p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#101828] mb-2">
              Post a Job
            </h1>
            <p className="text-lg text-[#667085]">
              Find local help for your tasks and projects
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-[#101828] mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Help Moving Furniture"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${errors.title
                  ? "border-red-500"
                  : "border-[#D1D5DB] focus:border-blue-500"
                  }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#101828] mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe the job in detail. What needs to be done? Any special requirements?"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors resize-none ${errors.description
                  ? "border-red-500"
                  : "border-[#D1D5DB] focus:border-blue-500"
                  }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Category and Location */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#101828] mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${errors.category
                    ? "border-red-500"
                    : "border-[#D1D5DB] focus:border-blue-500"
                    }`}
                >
                  <option value="">Select a category</option>
                  {jobCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.category}
                  </p>
                )}

                {/* Custom Category Input */}
                {showCustomCategory && (
                  <div className="mt-3">
                    <input
                      type="text"
                      name="customCategory"
                      value={formData.customCategory}
                      onChange={handleInputChange}
                      placeholder="Please specify the category"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${errors.customCategory
                        ? "border-red-500"
                        : "border-[#D1D5DB] focus:border-blue-500"
                        }`}
                    />
                    {errors.customCategory && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {errors.customCategory}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#101828] mb-2">
                  Location *
                </label>

                {/* Always show location picker - no toggle needed */}
                <LocationPicker
                  initialLocation={formData.location}
                  onLocationSelect={(locationData) => {
                    console.log('Location selected:', locationData);
                    setFormData(prev => ({
                      ...prev,
                      location: locationData.address
                    }));
                    // Clear location error when location is selected
                    if (errors.location) {
                      setErrors(prev => ({ ...prev, location: null }));
                    }
                  }}
                />

                {/* Debug: Show current location value */}
                {formData.location && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                    Debug: Current location = "{formData.location}"
                  </div>
                )}

                {errors.location && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.location}
                  </p>
                )}
              </div>
            </div>

            {/* Duration and Pay */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#101828] mb-2">
                  Duration *
                </label>
                <div className="relative">
                  <Clock
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF]"
                  />
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="e.g., 2-3 hours, 1 day"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${errors.duration
                      ? "border-red-500"
                      : "border-[#D1D5DB] focus:border-blue-500"
                      }`}
                  />
                </div>
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.duration}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#101828] mb-2">
                  Pay *
                </label>
                <div className="flex">
                  <div className="relative flex-1">
                    <DollarSign
                      size={18}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF]"
                    />
                    <input
                      type="number"
                      name="pay_amount"
                      value={formData.pay_amount}
                      onChange={handleInputChange}
                      placeholder="25"
                      min="0"
                      step="0.01"
                      className={`w-full pl-10 pr-4 py-3 border rounded-l-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${errors.pay_amount
                        ? "border-red-500"
                        : "border-[#D1D5DB] focus:border-blue-500"
                        }`}
                    />
                  </div>
                  <select
                    name="pay_type"
                    value={formData.pay_type}
                    onChange={handleInputChange}
                    className="px-3 py-3 border border-l-0 border-[#D1D5DB] rounded-r-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="hourly">/hour</option>
                    <option value="fixed">total</option>
                    <option value="per_task">/task</option>
                  </select>
                </div>
                {errors.pay_amount && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.pay_amount}
                  </p>
                )}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-[#101828] mb-2">
                Requirements (Optional)
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                rows={3}
                placeholder="Any specific requirements, skills needed, or things to bring?"
                className="w-full px-4 py-3 border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
              />
            </div>

            {/* Contact Information - Auto-filled from user account */}
            <div className="border-t border-[#EAECF0] pt-6">
              <h3 className="text-lg font-medium text-[#101828] mb-4">
                Contact Information
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#101828] mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={user.name}
                    disabled
                    className="w-full px-4 py-3 border border-[#D1D5DB] rounded-lg bg-gray-50 text-[#667085]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#101828] mb-2">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    name="poster_phone"
                    value={formData.poster_phone}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-[#101828] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 border border-[#D1D5DB] rounded-lg bg-gray-50 text-[#667085]"
                />
              </div>
            </div>

            {/* Urgent checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="urgent"
                checked={formData.urgent}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-[#667085]">
                This is an urgent job (will be highlighted in listings)
              </label>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-2" />
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={createJobMutation.isPending}
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createJobMutation.isPending ? "Posting Job..." : "Post Job"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
