# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `mobile-terminal-ide`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

## 2. Set up Database Schema

### Option A: Full Schema (Recommended)
1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the **entire contents** of `supabase-schema.sql` 
4. Paste it into the SQL Editor
5. Click **Run** to execute the schema

### Option B: If you get permission errors
1. Use `supabase-schema-simple.sql` instead
2. This version avoids advanced settings that might cause permission errors
3. Copy and paste the contents into SQL Editor
4. Click **Run**

✅ This will create:
- `workspaces` table - User workspaces
- `user_files` table - File system storage 
- Row Level Security policies (users can only see their own data)
- Indexes for performance

⚠️ **Permission errors are normal** - Supabase restricts some advanced database settings, but the core functionality will work perfectly.

## 3. Configure Environment Variables

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your project details:
   - **Project URL** 
   - **anon/public key**

3. Create `.env` file in your project root:

```bash
cp .env.example .env
```

4. Update `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. Enable Authentication

1. In Supabase dashboard → **Authentication** → **Settings**
2. Configure **Auth Settings**:
   - Enable email confirmations (optional)
   - Set site URL to your domain
   - Configure redirect URLs

## 5. Test the Setup

1. Start your development server:
```bash
npm run dev
```

2. Visit `http://localhost:5173`
3. You should see the login/signup form
4. Create a test account
5. Verify the user appears in **Authentication** → **Users**

## Database Schema Overview

### Tables

- **workspaces**: User workspaces/projects
- **user_files**: Virtual file system with content storage
- **terminal_sessions**: Persistent terminal state

### Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Automatic user isolation

### Features Enabled

- ✅ User authentication (email/password)
- ✅ User workspaces with file storage
- ✅ Persistent terminal sessions
- ✅ Real-time updates (optional)
- ✅ User data isolation
- ✅ Automatic workspace initialization

## Next Steps

After setup, users will:
1. Sign up/login with email
2. Get a default workspace with sample files
3. Have their files and terminal state preserved
4. Access their workspace from any device

## Troubleshooting

**Environment variables not working?**
- Ensure `.env` file is in project root
- Restart development server after changes
- Check variable names have `VITE_` prefix

**Database connection issues?**
- Verify Supabase URL and key are correct
- Check project is not paused (free tier)
- Ensure RLS policies are properly set

**Authentication not working?**
- Check auth settings in Supabase dashboard
- Verify email confirmation settings
- Test with confirmed email addresses