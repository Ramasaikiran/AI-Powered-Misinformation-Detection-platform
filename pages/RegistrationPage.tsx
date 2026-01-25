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
      setError('Email is required.');
      return;
    }
    if (registrationType === 'phone' && !phone) {
        setError('Phone number is required.');
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
    
    // Simulate sending OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpMessage(`For demonstration, your OTP is: ${newOtp}`);
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
      setError('Invalid OTP. Please try again.');
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
    <div className="flex flex-col items-center justify-center text-center animate-fade-in-up">
      <div className="max-w-4xl w-full bg-white/10 dark:bg-black/10 backdrop-blur-2xl rounded-2xl p-10 md:p-16 border border-black/10 dark:border-white/10 shadow-2xl">
         <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-black dark:text-white">
          Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">CodeHustlers</span>
        </h1>
        <p className="text-lg md:text-xl text-black/70 dark:text-white/70 max-w-3xl mx-auto mb-8">
          Create an account to access your personal dashboard and unlock the full suite of misinformation detection tools.
        </p>

        <div className="max-w-sm mx-auto">
          {registrationStep === 'details' ? (
            <>
              <h2 className="text-2xl font-bold mb-6 text-black dark:text-white">Create Account</h2>
              <form onSubmit={handleDetailsSubmit}>
                
                <div className="flex justify-center mb-4 rounded-lg p-1 bg-black/5 dark:bg-white/5">
                    <button type="button" onClick={() => setRegistrationType('email')} className={`w-1/2 py-2 rounded-md transition ${registrationType === 'email' ? 'bg-indigo-600 text-white shadow' : 'text-black/70 dark:text-white/70'}`}>Email</button>
                    <button type="button" onClick={() => setRegistrationType('phone')} className={`w-1/2 py-2 rounded-md transition ${registrationType === 'phone' ? 'bg-indigo-600 text-white shadow' : 'text-black/70 dark:text-white/70'}`}>Phone</button>
                </div>
                <div className="mb-4">
                  {registrationType === 'email' ? (
                    <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-transparent border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                  ) : (
                    <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 bg-transparent border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                  )}
                </div>
                <div className="mb-4">
                  <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-transparent border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
                <div className="mb-4">
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-transparent border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
                <div className="mb-4">
                  <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-transparent border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105">
                  Continue
                </button>
              </form>
              <p className="mt-8 text-sm text-black/60 dark:text-white/60">
                Already have an account?{' '}
                <button onClick={onSwitchToLogin} className="font-medium text-indigo-600 hover:text-indigo-500">
                    Login here
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">Verify Your Account</h2>
              <p className="text-black/70 dark:text-white/70 mb-4">
                Enter the 6-digit code sent to {registrationType === 'email' ? email : phone}.
              </p>
              {otpMessage && <p className="text-green-600 dark:text-green-400 text-sm mb-4 bg-green-500/10 p-2 rounded-md">{otpMessage}</p>}
              <form onSubmit={handleOtpSubmit}>
                <div className="flex justify-center space-x-2 mb-4">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => { otpInputRefs.current[index] = el; }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(e, index)}
                            onKeyDown={(e) => handleOtpKeyDown(e, index)}
                            className="w-12 h-12 text-center text-2xl font-bold bg-transparent border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    ))}
                </div>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105">
                    Verify & Register
                </button>
              </form>
               <p className="mt-4 text-sm text-black/60 dark:text-white/60">
                    Didn't get a code?{' '}
                    <button onClick={() => {setError(''); setRegistrationStep('details');}} className="font-medium text-indigo-600 hover:text-indigo-500">
                        Go back
                    </button>
                </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;