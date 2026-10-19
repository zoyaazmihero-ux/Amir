import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSuccessLogin(email.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Crunchyroll Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#FF640A] flex items-center justify-center p-1">
            <div className="w-full h-full bg-black rounded-full relative overflow-hidden flex items-center justify-center">
              <div className="absolute -left-1 w-5 h-5 rounded-full bg-[#FF640A]"></div>
              <div className="absolute right-1 w-2 h-2 rounded-full bg-black"></div>
            </div>
          </div>
          <span className="font-extrabold text-base text-white tracking-tight">Crunchyroll</span>
        </div>

        {/* SIGN UP FORM (Matching Screenshot 14) */}
        {mode === 'signup' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Create Account</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#FF640A]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-extrabold text-[#FF640A] hover:underline"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#FF640A]"
                />
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-tight">
                  Use at least 6 characters, do not use empty spaces.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#FF640A] hover:bg-[#e05300] text-black font-extrabold text-xs uppercase tracking-wider transition-transform hover:scale-102 shadow-lg mt-4 cursor-pointer"
              >
                CREATE ACCOUNT
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-zinc-400 space-y-3">
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-[#FF640A] font-extrabold hover:underline cursor-pointer"
                >
                  LOG IN
                </button>
              </p>
              <p className="text-[10px] text-zinc-500 leading-normal">
                By creating an account, you agree to the Crunchyroll Terms of Service & Privacy Policy.
              </p>
            </div>
          </div>
        )}

        {/* LOG IN FORM (Matching Screenshot 15) */}
        {mode === 'login' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Log In</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Email Address or Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter email or phone"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#FF640A]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#FF640A] hover:bg-[#e05300] text-black font-extrabold text-xs uppercase tracking-wider transition-transform hover:scale-102 shadow-lg mt-4 cursor-pointer"
              >
                NEXT
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-zinc-400">
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-[#FF640A] font-extrabold hover:underline cursor-pointer"
                >
                  CREATE ACCOUNT
                </button>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
