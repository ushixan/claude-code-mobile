import { supabase } from '../lib/supabase'
import type { UserWorkspace, UserFile } from '../lib/supabase'

export class WorkspaceService {
  static async createDefaultWorkspace(userId: string): Promise<UserWorkspace | null> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          user_id: userId,
          name: 'My Workspace',
        })
        .select()
        .single()

      if (error) throw error

      // Create default files
      await this.createDefaultFiles(userId, data.id)

      return data
    } catch (error) {
      console.error('Error creating workspace:', error)
      return null
    }
  }

  static async getUserWorkspaces(userId: string): Promise<UserWorkspace[]> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching workspaces:', error)
      return []
    }
  }

  static async getWorkspaceFiles(userId: string, workspaceId: string): Promise<UserFile[]> {
    try {
      const { data, error } = await supabase
        .from('user_files')
        .select('*')
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
        .order('path', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching files:', error)
      return []
    }
  }

  static async saveFile(
    userId: string, 
    workspaceId: string, 
    path: string, 
    content: string, 
    isDirectory: boolean = false
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_files')
        .upsert({
          user_id: userId,
          workspace_id: workspaceId,
          path,
          content,
          is_directory: isDirectory,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error saving file:', error)
      return false
    }
  }

  static async deleteFile(userId: string, workspaceId: string, path: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_files')
        .delete()
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
        .eq('path', path)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }

  static async createDefaultFiles(userId: string, workspaceId: string): Promise<void> {
    const defaultFiles = [
      {
        path: 'README.md',
        content: `# Welcome to Your Mobile Terminal IDE

This is your personal workspace in the cloud! 

## Features
- 📱 Mobile-optimized terminal and code editor
- 🤖 Claude Code AI assistant integration  
- 🌐 Live preview with proxy support
- 📁 File explorer with Git support
- ☁️ Cloud storage with Supabase

## Getting Started
1. Use the terminal to run commands like \`ls\`, \`pwd\`, \`git\`
2. Create new files with the editor
3. Preview web apps with the Preview tab
4. Your workspace is automatically saved!

Happy coding! 🚀
`,
        is_directory: false,
      },
      {
        path: 'package.json',
        content: `{
  "name": "my-workspace",
  "version": "1.0.0",
  "description": "My Mobile Terminal IDE workspace",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js",
    "test": "echo \\"No tests yet\\""
  },
  "keywords": ["mobile", "terminal", "ide"],
  "author": "You",
  "license": "MIT"
}`,
        is_directory: false,
      },
      {
        path: 'index.js',
        content: `// Welcome to your Mobile Terminal IDE!
console.log('Hello from your cloud workspace! 🚀');

// This is a Node.js file - you can run it with: node index.js
const message = 'Your personal development environment is ready!';
console.log(message);

// Try running some commands in the terminal:
// - ls (list files)
// - pwd (current directory) 
// - node index.js (run this file)
// - npm init (create new projects)
`,
        is_directory: false,
      },
      {
        path: '.gitignore',
        content: `node_modules/
*.log
.env
.DS_Store
dist/
build/
coverage/
.nyc_output/
`,
        is_directory: false,
      }
    ]

    for (const file of defaultFiles) {
      await this.saveFile(userId, workspaceId, file.path, file.content, file.is_directory)
    }
  }

  static async initializeUserWorkspace(userId: string): Promise<UserWorkspace | null> {
    // Check if user already has workspaces
    const workspaces = await this.getUserWorkspaces(userId)
    
    if (workspaces.length === 0) {
      // Create default workspace
      return await this.createDefaultWorkspace(userId)
    }
    
    return workspaces[0] // Return the first workspace
  }
}