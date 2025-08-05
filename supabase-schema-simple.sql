-- Simplified Supabase Schema for Mobile Terminal IDE
-- Run this in your Supabase SQL Editor if you encounter permission errors

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Workspace',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_files table for storing file system
CREATE TABLE IF NOT EXISTS user_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  path TEXT NOT NULL,
  content TEXT DEFAULT '' NOT NULL,
  is_directory BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure unique file paths per workspace
  UNIQUE(workspace_id, path)
);

-- Enable Row Level Security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;

-- Create policies for workspaces
CREATE POLICY "Users can manage their own workspaces" ON workspaces
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for user_files  
CREATE POLICY "Users can manage their own files" ON user_files
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_user_files_user_workspace ON user_files(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_files_path ON user_files(workspace_id, path);