import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, signup, googleLogin } = useAuth();
  const navigate = useNavigate();

  async function handleGoogleAuth() {
    setError('');
    setLoading(true);
    try {
      await googleLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, ''); // Display name is inferred from email in context
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none flex justify-center items-center">
         <div className="w-[800px] h-[800px] bg-primary-container opacity-20 rounded-full blur-[120px] mix-blend-multiply"></div>
      </div>

      <div className="glass-container w-full max-w-md p-10 flex flex-col z-10 shadow-[0_30px_60px_rgba(0,0,0,0.1)] backdrop-blur-2xl">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
           <div className="h-12 w-12 rounded-full bg-primary-container/30 flex items-center justify-center shadow-ambient mb-4">
               <div className="w-3 h-3 bg-secondary rounded-full animate-pulse shadow-[0_0_12px_#2b6485]"></div>
           </div>
           <h2 className="text-3xl font-light tracking-[0.2em] font-display text-primary text-center">ADVANCED INTEL</h2>
           <p className="text-xs tracking-widest meta-label mt-2 opacity-50">CLINICAL COGNITIVE TELEMETRY</p>
        </div>

        {error && <div className="p-3 mb-6 bg-error/10 border border-error/30 text-error text-xs uppercase tracking-widest text-center">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col">
            <label className="meta-label mb-2 opacity-60">PERSONNEL IDENTIFIER (EMAIL)</label>
            <input 
              type="email" 
              required
              className="clinical-input w-full bg-surface-container-highest/30 border border-outline-variant/30 p-3 text-sm focus:border-primary/50 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="meta-label mb-2 opacity-60">ACCESS KEY (PASSWORD)</label>
            <input 
              type="password" 
              required
              className="clinical-input w-full bg-surface-container-highest/30 border border-outline-variant/30 p-3 text-sm focus:border-primary/50 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-primary/90 hover:bg-primary text-on-primary py-4 font-display uppercase tracking-widest text-xs mt-4 shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : (isLogin ? 'INITIALIZE CONNECTION' : 'REQUEST CLEARANCE')}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6 opacity-30">
           <div className="h-px bg-on-surface flex-1"></div>
           <span className="text-[10px] tracking-widest meta-label">OR</span>
           <div className="h-px bg-on-surface flex-1"></div>
        </div>

        <button 
          disabled={loading}
          onClick={handleGoogleAuth}
          className="w-full bg-surface-container-highest/50 border border-outline-variant/30 hover:bg-surface-container-highest hover:border-primary/50 text-primary py-4 flex items-center justify-center gap-3 font-display uppercase tracking-widest text-xs transition-all disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
          SYNC WITH GOOGLE NEURAL LINK
        </button>

        <div className="mt-8 text-center">
           <span 
             onClick={() => setIsLogin(!isLogin)} 
             className="text-xs meta-label cursor-pointer opacity-50 hover:opacity-100 hover:text-primary transition-colors"
            >
             {isLogin ? 'NO ACCESS? REGISTER NEW NODE' : 'HAVE CLEARANCE? INITIATE SHUTTLE'}
           </span>
        </div>

      </div>
    </div>
  );
}
