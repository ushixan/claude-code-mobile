import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Terminal, Code2, Smartphone } from 'lucide-react'
import { FaGithub } from 'react-icons/fa'

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signUp, signInWithGitHub } = useAuth()

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
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubSignIn = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { error } = await signInWithGitHub()
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('Failed to sign in with GitHub')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Terminal className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Mobile Terminal IDE
          </h1>
          <p className="text-slate-300">
            Your personal cloud development environment
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur p-4 rounded-lg text-center">
            <Code2 className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-slate-300">Code Editor</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur p-4 rounded-lg text-center">
            <Terminal className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-slate-300">Full Terminal</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur p-4 rounded-lg text-center">
            <Smartphone className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-slate-300">Mobile First</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur p-4 rounded-lg text-center">
            <div className="w-6 h-6 bg-orange-400 rounded mx-auto mb-2 flex items-center justify-center">
              <span className="text-xs font-bold text-white">AI</span>
            </div>
            <p className="text-sm text-slate-300">Claude Code</p>
          </div>
        </div>

        {/* Auth Form */}
        <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-8 shadow-2xl">
          {/* GitHub Sign In Button */}
          <button
            onClick={handleGitHubSignIn}
            disabled={loading}
            className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-900/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-3 mb-4 border border-gray-700"
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
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-800/80 text-slate-400">Or continue with email</span>
            </div>
          </div>

          <div className="flex bg-slate-700 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-300 hover:text-white'
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
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
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
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
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
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center"
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
        <div className="text-center mt-8">
          <p className="text-slate-400 text-sm">
            Powered by Claude Code & Supabase
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthForm