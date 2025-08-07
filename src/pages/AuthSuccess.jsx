import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Extract token and username from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const username = urlParams.get('username');

    if (token && username) {
      // Store GitHub credentials
      localStorage.setItem('github_token', token);
      localStorage.setItem('github_username', username);
      localStorage.setItem('github_authenticated', 'true');
      
      // Redirect to main app
      setTimeout(() => {
        window.location.href = '/'; // Full page reload to update auth state
      }, 1500);
    } else {
      // No token, redirect to home
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Authentication Successful!</h1>
        <p className="text-gray-600 dark:text-gray-400">Redirecting you to the app...</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthSuccess;