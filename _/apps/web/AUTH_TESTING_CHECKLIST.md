# Auth System Testing Checklist

Since Google OAuth sign-in is working, here's a comprehensive checklist to test your entire auth system before proceeding with other tasks.

## 🔧 Automated Tests

Run this script to test your auth system automatically:
```bash
node scripts/test-auth-complete.js
```

## ✅ Manual Testing Checklist

### 1. Google OAuth Flow
- [ ] **Sign Up with Google**: Go to `/account/signup` → Click "Continue with Google"
- [ ] **Sign In with Google**: Go to `/account/signin` → Click "Continue with Google"
- [ ] **Profile Creation**: Check if user profile is created in Supabase Dashboard
- [ ] **Redirect Handling**: Verify redirect to home page after auth
- [ ] **Session Persistence**: Refresh page, user should stay logged in

### 2. Email/Password Authentication
- [ ] **Email Sign Up**: Create account with email/password
- [ ] **Email Confirmation**: Check if email confirmation is required
- [ ] **Email Sign In**: Sign in with email/password
- [ ] **Password Validation**: Test password requirements (min 6 chars)
- [ ] **Error Handling**: Test with invalid credentials

### 3. Password Reset Flow
- [ ] **Forgot Password**: Go to `/account/forgot-password`
- [ ] **Reset Email**: Check if reset email is sent
- [ ] **Reset Password**: Complete password reset flow
- [ ] **New Password Login**: Sign in with new password

### 4. User Session Management
- [ ] **Sign Out**: Test sign out functionality
- [ ] **Session Expiry**: Test automatic session refresh
- [ ] **Multiple Tabs**: Test auth state across browser tabs
- [ ] **Browser Refresh**: Auth state should persist

### 5. Database Integration
- [ ] **Profile Creation**: New users get profiles in `profiles` table
- [ ] **User Metadata**: Google users get name from OAuth
- [ ] **Data Consistency**: User data matches between auth and profiles

### 6. Error Handling
- [ ] **Network Errors**: Test with poor connection
- [ ] **Invalid Redirects**: Test malformed callback URLs
- [ ] **Expired Sessions**: Test with expired auth tokens
- [ ] **Rate Limiting**: Test multiple failed attempts

### 7. Security Checks
- [ ] **RLS Policies**: Unauthenticated users can't access profiles
- [ ] **CSRF Protection**: Auth forms have proper protection
- [ ] **Secure Redirects**: Only allowed domains for redirects
- [ ] **Token Security**: Auth tokens are httpOnly (if applicable)

## 🎯 Key Areas to Verify

### Authentication Context
Check that `useAuth` hook provides:
- [ ] Current user state
- [ ] Loading states
- [ ] Sign in/up/out functions
- [ ] Error handling

### Database Schema
Verify these tables exist and work:
- [ ] `profiles` table with proper columns
- [ ] RLS policies are active
- [ ] Auth triggers work correctly
- [ ] Foreign key constraints

### Environment Configuration
- [ ] All required env vars are set
- [ ] Supabase connection works
- [ ] Google OAuth credentials are valid
- [ ] Redirect URLs are configured

## 🚨 Common Issues to Watch For

### Google OAuth Issues
- **"Provider not found"**: Enable Google in Supabase Dashboard
- **"Invalid redirect URI"**: Add callback URLs to Google Console
- **"Access denied"**: Check OAuth consent screen setup

### Email Auth Issues
- **"Signup is disabled"**: Enable email signup in Supabase
- **"Email not confirmed"**: Check email confirmation settings
- **"Invalid email"**: Verify email validation rules

### Database Issues
- **"RLS policy violation"**: Check row-level security policies
- **"Function does not exist"**: Run database migrations
- **"Permission denied"**: Verify user permissions

## 📊 Success Criteria

Your auth system is ready when:
- [ ] ✅ Google OAuth works end-to-end
- [ ] ✅ Email auth works (if enabled)
- [ ] ✅ User profiles are created automatically
- [ ] ✅ Sessions persist across page refreshes
- [ ] ✅ Sign out works properly
- [ ] ✅ Error messages are user-friendly
- [ ] ✅ No console errors during auth flows

## 🎉 Next Steps

Once all tests pass, you can confidently proceed with:
1. **Protected Routes**: Add authentication guards
2. **User Dashboard**: Build user profile pages
3. **Feature Development**: Add business logic
4. **Production Deployment**: Configure production OAuth

## 🔍 Quick Test Commands

```bash
# Test database connection
node scripts/test-connection.js

# Test auth configuration
node scripts/test-auth.js

# Run comprehensive auth tests
node scripts/test-auth-complete.js
```

Your Google OAuth is working, so focus on testing the complete user journey and database integration!