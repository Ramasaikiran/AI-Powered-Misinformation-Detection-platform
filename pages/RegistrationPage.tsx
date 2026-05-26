import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';

interface RegistrationPageProps {
  onRegister: (username: string, emailOrPhone: string, type: 'email' | 'phone') => void;
  onSwitchToLogin: () => void;
}

const RegistrationPage: React.FC<RegistrationPageProps> = ({ onRegister, onSwitchToLogin }) => {
  const [registrationType, setRegistrationType] = useState<'email' | 'phone'>('email');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [error, setError] = useState('');
  const [registrationStep, setRegistrationStep] = useState<'details' | 'otp'>('details');
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (registrationType === 'email' && !email) {
      setError('Email Address is required.');
      return;
    }
    if (registrationType === 'phone' && !phone) {
        setError('Phone Number is required.');
        return;
    }
    if (registrationType === 'phone' && !/^\+?[1-9]\d{1,14}$/.test(phone)) {
        setError('Please enter a valid phone number including country code (e.g., +1234567890).');
        return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    // Simulate OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpMessage(`Telemetry Node Verification OTP: ${newOtp}`);
    setRegistrationStep('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
        setError('Please enter the full 6-digit OTP.');
        return;
    }
    if (enteredOtp === generatedOtp) {
      setError('');
      const destination = registrationType === 'email' ? email : phone;
      onRegister(username, destination, registrationType);
    } else {
      setError('Invalid OTP code. Please trace logs.');
    }
  };

  const handleOtpChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 animate-float">
      
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full radial-glow-purple pointer-events-none opacity-40"></div>

      <div className="max-w-md w-full glass rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-white/5 shadow-2xl relative z-10 space-y-8">
         
         <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-purple-400/20 bg-purple-950/20 text-purple-500 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest">
              <span>Node Initialization</span>
            </div>
            <h2 className="text-3xl font-black font-heading text-slate-800 dark:text-white">
              {registrationStep === 'details' ? 'Create Node' : 'Verify Node'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-white/50">
              {registrationStep === 'details' 
                ? 'Register your telemetry identity inside Code Hustlers.' 
                : 'Confirm node identity using the OTP code generated below.'}
            </p>
         </div>

        <div className="space-y-4">
          {registrationStep === 'details' ? (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
                
                {/* Method selector */}
                <div className="flex rounded-xl p-1 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <button 
                      type="button" 
                      onClick={() => setRegistrationType('email')} 
                      className={`w-1/2 py-2 rounded-lg text-xs uppercase font-extrabold tracking-wider transition ${registrationType === 'email' ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg' : 'text-slate-500 dark:text-white/60'}`}
                    >
                      Email Channel
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setRegistrationType('phone')} 
                      className={`w-1/2 py-2 rounded-lg text-xs uppercase font-extrabold tracking-wider transition ${registrationType === 'phone' ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg' : 'text-slate-500 dark:text-white/60'}`}
                    >
                      Phone Channel
                    </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/40 font-bold block" htmlFor="destination">
                    {registrationType === 'email' ? 'Email Address' : 'Phone Number'}
                  </label>
                  {registrationType === 'email' ? (
                    <input 
                      id="destination"
                      type="email" 
                      placeholder="operator@company.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="w-full px-4 py-3 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all duration-300 font-mono"
                    />
                  ) : (
                    <input 
                      id="destination"
                      type="tel" 
                      placeholder="+1234567890" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      className="w-full px-4 py-3 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all duration-300 font-mono"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/40 font-bold block" htmlFor="username">Node Nickname</label>
                  <input 
                    id="username"
                    type="text" 
                    placeholder="Operator_01" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all duration-300 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/40 font-bold block" htmlFor="password">Gate Password</label>
                  <input 
                    id="password"
                    type="password" 
                    placeholder="••••••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all duration-300 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/40 font-bold block" htmlFor="confirmPassword">Confirm Password</label>
                  <input 
                    id="confirmPassword"
                    type="password" 
                    placeholder="••••••••••••" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all duration-300 font-mono"
                  />
                </div>

                {error && (
                  <p className="text-red-500 dark:text-red-400 text-xs font-mono bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                    {error}
                  </p>
                )}

                <button 
                  type="submit" 
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-[1.02] border border-white/10"
                >
                  Generate Telemetry Token
                </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
                <p className="text-slate-500 dark:text-white/60 text-xs text-center">
                  We've sent a simulated authorization key below:
                </p>
                
                {otpMessage && (
                  <p className="text-green-500 dark:text-green-400 text-xs font-mono text-center bg-green-500/10 p-2.5 rounded-xl border border-green-500/20 animate-pulse">
                    {otpMessage}
                  </p>
                )}

                <div className="flex justify-center space-x-2">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => { otpInputRefs.current[index] = el; }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(e, index)}
                            onKeyDown={(e) => handleOtpKeyDown(e, index)}
                            className="w-11 h-12 text-center text-xl font-bold bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all font-mono"
                            aria-label={`Digit ${index + 1}`}
                        />
                    ))}
                </div>

                {error && (
                  <p className="text-red-500 dark:text-red-400 text-xs font-mono bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                    {error}
                  </p>
                )}

                <button 
                  type="submit" 
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-[1.02] border border-white/10"
                >
                    Confirm Telemetry Activation
                </button>

                <p className="text-center text-xs">
                    <button 
                      type="button"
                      onClick={() => {setError(''); setRegistrationStep('details');}} 
                      className="font-black text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 hover:underline uppercase tracking-widest text-[10px]"
                    >
                        &lt; Correct Specifications
                    </button>
                </p>
            </form>
          )}

          {registrationStep === 'details' && (
            <p className="text-center text-xs text-slate-500 dark:text-white/50 pt-2 font-mono">
                Already registered?{' '}
                <button onClick={onSwitchToLogin} className="font-extrabold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 hover:underline uppercase text-[11px] tracking-wider transition-colors ml-1 focus:outline-none">
                    Login Node &gt;
                </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default RegistrationPage;