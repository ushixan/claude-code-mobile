-- Supabase Database Schema for Mobile Terminal IDE
-- Run this in your Supabase SQL Editor

-- Create workspaces table
CREATE TABLE workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Workspace',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_files table for storing file system
CREATE TABLE user_files (
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

-- Create terminal_sessions table for persisting terminal state
CREATE TABLE terminal_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  session_data JSONB DEFAULT '{}' NOT NULL,
  working_directory TEXT DEFAULT '/' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for workspaces
CREATE POLICY "Users can view their own workspaces" ON workspaces
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workspaces" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workspaces" ON workspaces
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workspaces" ON workspaces
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for user_files
CREATE POLICY "Users can view their own files" ON user_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own files" ON user_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files" ON user_files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files" ON user_files
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for terminal_sessions
CREATE POLICY "Users can view their own terminal sessions" ON terminal_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own terminal sessions" ON terminal_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own terminal sessions" ON terminal_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own terminal sessions" ON terminal_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX idx_user_files_user_workspace ON user_files(user_id, workspace_id);
CREATE INDEX idx_user_files_path ON user_files(workspace_id, path);
CREATE INDEX idx_terminal_sessions_user_workspace ON terminal_sessions(user_id, workspace_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_workspaces_updated_at 
  BEFORE UPDATE ON workspaces 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_files_updated_at 
  BEFORE UPDATE ON user_files 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_terminal_sessions_updated_at 
  BEFORE UPDATE ON terminal_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();