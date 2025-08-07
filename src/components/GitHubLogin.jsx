import React, { useState, useEffect } from 'react';
import { FaGithub } from 'react-icons/fa';

const GitHubLogin = ({ onLogin }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if there's a token in localStorage
    const token = localStorage.getItem('github_token');
    const savedUsername = localStorage.getItem('github_username');
    
    if (token) {
      // Verify token with backend
      verifyToken(token);
    }
    
    // Check for auth callback
    const urlParams = new URLSearchParams(window.location.search);
    const callbackToken = urlParams.get('token');
    const callbackUsername = urlParams.get('username');
    
    if (callbackToken && callbackUsername) {
      // Save token and username
      localStorage.setItem('github_token', callbackToken);
      localStorage.setItem('github_username', callbackUsername);
      setIsAuthenticated(true);
      setUsername(callbackUsername);
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Notify parent component
      if (onLogin) {
        onLogin(callbackToken, callbackUsername);
      }
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUsername(data.githubUsername);
        
        if (onLogin) {
          onLogin(token, data.githubUsername);
        }
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('github_token');
        localStorage.removeItem('github_username');
      }
    } catch (error) {
      console.error('Error verifying token:', error);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Get GitHub OAuth URL from backend
      const response = await fetch('/api/auth/github');
      const data = await response.json();
      
      // Redirect to GitHub OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error initiating GitHub login:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_username');
    setIsAuthenticated(false);
    setUsername('');
  };

  return (
    <div className="github-login-container p-4">
      {isAuthenticated ? (
        <div className="flex items-center gap-3">
          <FaGithub className="text-2xl" />
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">Logged in as</p>
            <p className="font-semibold">{username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaGithub className="text-xl" />
          <span>{loading ? 'Connecting...' : 'Login with GitHub'}</span>
        </button>
      )}
    </div>
  );
};

export default GitHubLogin;