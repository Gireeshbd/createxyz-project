# Requirements Document

## Introduction

This specification outlines the requirements for enhancing the Uneven Jobs database schema to support a complete job marketplace platform using Supabase as the database backend. The current system supports basic job posting and browsing with Neon PostgreSQL, but lacks essential features for job applications, user interactions, reviews, and payment tracking. This enhancement will migrate to Supabase and transform the platform from a simple job board into a fully functional marketplace with real-time capabilities.

## Requirements

### Requirement 1

**User Story:** As a job seeker, I want to apply for jobs and track my applications, so that I can manage my job search effectively and know the status of my applications.

#### Acceptance Criteria

1. WHEN a user views a job posting THEN the system SHALL display an "Apply" button for authenticated users
2. WHEN a user clicks "Apply" THEN the system SHALL allow them to submit an application with a message and proposed rate
3. WHEN a user submits an application THEN the system SHALL store the application with timestamp and status
4. WHEN a user views their dashboard THEN the system SHALL display all their job applications with current status
5. IF a user has already applied to a job THEN the system SHALL show "Applied" status instead of "Apply" button

### Requirement 2

**User Story:** As a job poster, I want to receive and manage job applications, so that I can select the best candidate for my job.

#### Acceptance Criteria

1. WHEN someone applies to my job THEN the system SHALL notify me of the new application
2. WHEN I view my posted job THEN the system SHALL display all applications received
3. WHEN I review an application THEN the system SHALL allow me to accept, reject, or request more information
4. WHEN I accept an application THEN the system SHALL update the job status to "assigned" and notify the selected applicant
5. WHEN I reject an application THEN the system SHALL update the application status and optionally notify the applicant

### Requirement 3

**User Story:** As a platform user, I want to rate and review other users after job completion, so that the community can build trust and make informed decisions.

#### Acceptance Criteria

1. WHEN a job is marked as completed THEN the system SHALL prompt both parties to rate each other
2. WHEN submitting a review THEN the system SHALL require a rating (1-5 stars) and allow optional written feedback
3. WHEN a user profile is viewed THEN the system SHALL display their average rating and recent reviews
4. WHEN calculating user ratings THEN the system SHALL compute weighted averages based on recency and reviewer credibility
5. IF a user has no reviews THEN the system SHALL display "New User" status instead of a rating

### Requirement 4

**User Story:** As a job poster and applicant, I want to communicate directly through the platform with real-time messaging, so that I can discuss job details, ask questions, and coordinate work without sharing personal contact information.

#### Acceptance Criteria

1. WHEN a job application is submitted THEN the system SHALL create a private conversation thread between poster and applicant using Supabase real-time subscriptions
2. WHEN I send a message THEN the system SHALL deliver it instantly to the recipient using Supabase real-time and mark it as unread
3. WHEN I receive a message THEN the system SHALL notify me in real-time and display an unread indicator
4. WHEN I view a conversation THEN the system SHALL display all messages in chronological order with timestamps and show typing indicators
5. WHEN a job is completed or cancelled THEN the system SHALL archive the conversation but keep it accessible
6. WHEN I'm online THEN the system SHALL show my presence status to conversation participants

### Requirement 5

**User Story:** As a job poster, I want to make secure payments through the platform, so that I can pay for completed work safely and maintain transaction records.

#### Acceptance Criteria

1. WHEN I accept a job application THEN the system SHALL create a payment escrow for the agreed amount
2. WHEN work is completed THEN the system SHALL allow me to release payment to the worker
3. WHEN payment is processed THEN the system SHALL record the transaction with all relevant details
4. WHEN I view my payment history THEN the system SHALL display all transactions with dates, amounts, and job details
5. IF there's a dispute THEN the system SHALL hold payment in escrow until resolution

### Requirement 6

**User Story:** As a worker, I want to receive payments securely and track my earnings, so that I can manage my income and have proof of payment.

#### Acceptance Criteria

1. WHEN a job is completed and approved THEN the system SHALL process payment to my account
2. WHEN I receive payment THEN the system SHALL send me a confirmation with transaction details
3. WHEN I view my earnings dashboard THEN the system SHALL display total earnings, pending payments, and payment history
4. WHEN tax season arrives THEN the system SHALL provide downloadable earning statements
5. IF payment fails THEN the system SHALL retry automatically and notify me of any issues

### Requirement 7

**User Story:** As a platform administrator, I want to monitor all transactions and user interactions, so that I can ensure platform integrity and resolve disputes.

#### Acceptance Criteria

1. WHEN any transaction occurs THEN the system SHALL log all details for audit purposes
2. WHEN a dispute is reported THEN the system SHALL provide access to all relevant messages and transaction history
3. WHEN reviewing platform activity THEN the system SHALL display metrics on jobs, applications, and payments
4. WHEN investigating user behavior THEN the system SHALL provide comprehensive activity logs
5. IF fraudulent activity is detected THEN the system SHALL flag accounts and freeze related transactions
### 
Requirement 8

**User Story:** As a platform user, I want secure file sharing and media uploads, so that I can share job-related images, documents, and attachments through Supabase Storage.

#### Acceptance Criteria

1. WHEN posting a job THEN the system SHALL allow me to upload images and documents using Supabase Storage
2. WHEN messaging another user THEN the system SHALL allow me to share files and images securely
3. WHEN uploading files THEN the system SHALL validate file types and sizes for security
4. WHEN viewing shared files THEN the system SHALL provide secure, time-limited access URLs
5. IF I delete my account THEN the system SHALL remove all my uploaded files from Supabase Storage

### Requirement 9

**User Story:** As a developer, I want to leverage Supabase's built-in features, so that I can reduce development complexity and improve system reliability.

#### Acceptance Criteria

1. WHEN implementing authentication THEN the system SHALL use Supabase Auth instead of Auth.js for better integration
2. WHEN querying data THEN the system SHALL use Supabase's auto-generated APIs alongside custom endpoints
3. WHEN implementing security THEN the system SHALL use Supabase Row Level Security (RLS) policies
4. WHEN handling real-time features THEN the system SHALL use Supabase real-time subscriptions
5. WHEN managing database schema THEN the system SHALL use Supabase migrations and version control