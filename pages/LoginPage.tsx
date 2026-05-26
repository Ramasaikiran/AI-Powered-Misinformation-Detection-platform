import React, { useState } from 'react';
import { ICONS } from '../constants';

interface LoginPageProps {
  onLogin: (loginDetails: { identifier: string }) => void;
  onSwitchToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToRegister }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) {
        setError('Authorized Identifier is required.');
        return;
    }
    if (!password) {
      setError('Security Credential is required.');
      return;
    }
    setError('');
    onLogin({ identifier: usernameOrEmail });
  };
  
  const handleGoogleSignIn = () => {
    setError('');
    onLogin({ identifier: 'admin@kronosx.ai' });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 animate-float">
      
      {/* Neon glow overlays */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full radial-glow-cyan pointer-events-none opacity-40"></div>
      
      <div className="max-w-md w-full glass rounded-3xl p-8 md:p-12 border border-white/5 shadow-2xl relative z-10 space-y-8">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-950/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
            <span>Security Gateway</span>
          </div>
          <h2 className="text-3xl font-black font-heading text-white">
            Access Console
          </h2>
          <p className="text-xs text-white/50">
            Provide credentials to unlock credibility telemetry features.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
            
            <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block" htmlFor="identifier">Identifier</label>
                <input 
                  id="identifier"
                  type="text" 
                  placeholder="Email or Username" 
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all duration-300 font-mono"
                />
            </div>
            
            <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block" htmlFor="password">Credential</label>
                <input 
                  id="password"
                  type="password" 
                  placeholder="••••••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all duration-300 font-mono"
                />
            </div>

            {error && (
              <p className="text-red-400 text-xs font-mono bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                {error}
              </p>
            )}

            <button 
              type="submit" 
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-[1.02] border border-white/10"
            >
                Initialize Console
            </button>
        </form>

        <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-3 bg-cyber-black text-[9px] font-mono text-white/40 uppercase tracking-widest">Federated Access</span>
        </div>

        {/* Federated Sign-In Button */}
        <button 
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/20 text-white/80 hover:text-white font-extrabold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
        >
            {ICONS.google}
            <span>Verify with Google Account</span>
        </button>
        
        {/* Switching Footer link */}
        <p className="text-center text-xs text-white/50 pt-2 font-mono">
            New telemetry node?{' '}
            <button onClick={onSwitchToRegister} className="font-extrabold text-cyan-400 hover:text-cyan-300 hover:underline uppercase text-[11px] tracking-wider transition-colors ml-1 focus:outline-none">
                Register Node &gt;
            </button>
        </p>

      </div>
    </div>
  );
};

export default LoginPage;