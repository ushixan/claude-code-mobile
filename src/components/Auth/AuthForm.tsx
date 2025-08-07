import { useState, type CSSProperties } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Terminal, Code2, Smartphone } from 'lucide-react'
import { FaGithub } from 'react-icons/fa'

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password)

      if (error) {
        setError(error.message)
      } else if (!isLogin) {
        setError('Check your email for the confirmation link!')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubSignIn = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Use relative path so Vite proxy handles dev routing
      const baseUrl = ''
      
      // Get the auth URL from your server
      const response = await fetch(`${baseUrl}/api/auth/github`);
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }
      const { authUrl } = await response.json();
      
      if (!authUrl) {
        throw new Error('Missing authUrl in response')
      }
      // Redirect to GitHub for authentication
      window.location.href = authUrl;
    } catch {
      setError('Failed to initiate GitHub login. Please try email/password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-y-auto" style={{ minHeight: '100vh', WebkitOverflowScrolling: 'touch' } as CSSProperties}>
      <div className="w-full max-w-md mx-auto px-4 py-4 sm:py-8 min-h-screen">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className="bg-blue-600 p-2.5 sm:p-3 rounded-xl">
              <Terminal className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Mobile Terminal IDE
          </h1>
          <p className="text-sm sm:text-base text-slate-300 px-4">
            Your personal cloud development environment
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-slate-800/50 backdrop-blur p-3 sm:p-4 rounded-lg text-center">
            <Code2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-xs sm:text-sm text-slate-300">Code Editor</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur p-3 sm:p-4 rounded-lg text-center">
            <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-xs sm:text-sm text-slate-300">Full Terminal</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur p-3 sm:p-4 rounded-lg text-center">
            <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-xs sm:text-sm text-slate-300">Mobile First</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur p-3 sm:p-4 rounded-lg text-center">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-400 rounded mx-auto mb-1.5 sm:mb-2 flex items-center justify-center">
              <span className="text-[10px] sm:text-xs font-bold text-white">AI</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">Claude Code</p>
          </div>
        </div>

        {/* Auth Form */}
        <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-5 sm:p-8 shadow-2xl">
          {/* GitHub Sign In Button */}
          <button
            onClick={handleGitHubSignIn}
            disabled={loading}
            className="w-full min-h-[48px] py-3 px-4 bg-gray-900 hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-900/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-3 mb-4 border border-gray-700 text-base touch-manipulation"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <FaGithub className="w-5 h-5" />
                Sign in with GitHub
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-5 sm:my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-3 sm:px-4 bg-slate-800/80 text-slate-400">Or continue with email</span>
            </div>
          </div>

          <div className="flex bg-slate-700 rounded-lg p-1 mb-5 sm:mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 min-h-[40px] py-2 px-3 sm:px-4 rounded-md text-sm font-medium transition-all touch-manipulation ${
                isLogin 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-300 hover:text-white active:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 min-h-[40px] py-2 px-3 sm:px-4 rounded-md text-sm font-medium transition-all touch-manipulation ${
                !isLogin 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-300 hover:text-white active:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                placeholder="Enter your email"
                autoComplete="email"
                inputMode="email"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{ fontSize: '16px' }}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center text-base touch-manipulation"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 pb-4">
          <p className="text-slate-400 text-xs sm:text-sm">
            Powered by Claude Code & Supabase
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthForm