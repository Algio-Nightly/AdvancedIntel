import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { googleLogin } = useAuth();
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

        <div className="flex flex-col gap-4">
          <p className="text-[10px] meta-label text-center opacity-40 uppercase tracking-[0.2em] mb-4">Personnel Authentication Required</p>
          
          <button 
            disabled={loading}
            onClick={handleGoogleAuth}
            className="w-full bg-primary/90 hover:bg-primary text-on-primary py-5 flex items-center justify-center gap-3 font-display uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_40px_rgba(var(--primary),0.5)] disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
            {loading ? 'SYNCHRONIZING...' : 'SYNC WITH GOOGLE NEURAL LINK'}
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-outline-variant/10 text-center">
           <p className="text-[9px] meta-label opacity-30 uppercase tracking-widest">Secured by Identity Platform</p>
        </div>

      </div>
    </div>
  );
}
