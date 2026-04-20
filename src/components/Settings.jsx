import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme, THEMES } from '../context/ThemeContext';
import { useAI } from '../context/AIContext';
import { Palette, CheckCircle2, Sun, Moon, Cpu, Eye, EyeOff, KeyRound, Trash2, ExternalLink } from 'lucide-react';

export default function Settings() {
  const { currentUser } = useAuth();
  const { currentTheme, setCurrentTheme } = useTheme();
  const { apiKey, saveApiKey, removeApiKey, isAvailable } = useAI();

  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const coreThemes = THEMES.filter(t => ['clinical', 'phantom', 'biosphere', 'sterile'].includes(t.id));
  const lightThemes = THEMES.filter(t => t.id.endsWith('-light'));
  const darkThemes = THEMES.filter(t => t.id.endsWith('-dark'));

  // Mask the stored key for display
  const maskedKey = apiKey
    ? apiKey.slice(0, 6) + '•'.repeat(Math.max(0, apiKey.length - 10)) + apiKey.slice(-4)
    : '';

  async function handleSaveKey() {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await saveApiKey(trimmed);
      setKeyInput('');
    } catch {
      // Toast is handled in context
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveKey() {
    setSaving(true);
    try {
      await removeApiKey();
    } finally {
      setSaving(false);
    }
  }

  const ThemeCard = ({ theme }) => {
    const isActive = currentTheme === theme.id;
    const isLight = theme.id.endsWith('-light') || theme.id === 'sterile';

    return (
      <button
        key={theme.id}
        onClick={() => setCurrentTheme(theme.id)}
        className={`relative p-4 rounded-xl border transition-all duration-300 text-left group ${isActive
            ? 'border-primary bg-primary/10 shadow-[0_0_24px_rgb(var(--primary)/0.15)] scale-[1.02]'
            : 'border-outline-variant/20 hover:border-primary/40 hover:bg-surface-container/40'
          }`}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2.5">
            <div
              className="h-6 w-6 rounded-md shadow-inner border border-white/10"
              style={{ backgroundColor: theme.color }}
            />
            {isLight
              ? <Sun size={12} className="opacity-40" />
              : <Moon size={12} className="opacity-40" />
            }
          </div>
          {isActive && <CheckCircle2 size={16} className="text-primary" />}
        </div>

        <h4 className="font-display text-[11px] tracking-widest uppercase mb-0.5">{theme.name}</h4>
        <p className="text-[9px] opacity-40 leading-relaxed">{theme.description}</p>
      </button>
    );
  };

  return (
    <div className="flex flex-col text-on-surface min-h-screen">
      <main className="w-full max-w-5xl mx-auto pt-32 flex flex-col px-4 xl:px-12 pb-20">
        <h1 className="text-4xl font-light mb-10 font-display uppercase tracking-widest text-primary">Personnel File</h1>

        <div className="flex flex-col gap-8">

          {/* Identity Section */}
          <div className="glass-container p-8 flex flex-col gap-6">
            <div className="flex items-center gap-6 border-b border-outline-variant/20 pb-6">
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center shadow-ambient border border-primary/30">
                <span className="text-2xl text-primary font-display font-bold">
                  {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-light font-display">{currentUser?.email}</h2>
                <span className="meta-label opacity-50 mt-1">UID: {currentUser?.uid}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                <span className="meta-label tracking-widest text-[10px] opacity-60">NETWORK STATUS: SECURE</span>
              </div>
            </div>
          </div>

          {/* AI Configuration Section */}
          <div className="glass-container p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2">
              <Cpu className="text-primary" size={20} />
              <h3 className="font-display tracking-[0.2em] text-sm uppercase">AI Configuration</h3>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-container/60 border border-outline-variant/10">
              <div className={`h-2.5 w-2.5 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-red-400/60'}`} />
              <span className="text-xs font-display tracking-widest uppercase opacity-70">
                {isAvailable ? 'GEMINI CONNECTED' : 'NO API KEY CONFIGURED'}
              </span>
            </div>

            {/* Current Key Display */}
            {isAvailable && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/5 border border-primary/15">
                <KeyRound size={14} className="text-primary opacity-60" />
                <span className="text-xs font-mono flex-1 opacity-70">{maskedKey}</span>
                <button
                  onClick={handleRemoveKey}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all font-display tracking-widest uppercase disabled:opacity-40"
                >
                  <Trash2 size={11} />
                  Remove
                </button>
              </div>
            )}

            {/* Key Input */}
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-display tracking-widest uppercase opacity-50">
                {isAvailable ? 'Replace API Key' : 'Enter Gemini API Key'}
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-surface-container/60 border border-outline-variant/20 rounded-lg px-4 py-3 pr-10 text-sm font-mono text-on-surface placeholder:opacity-30 focus:outline-none focus:border-primary/50 focus:bg-surface-container/80 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition-opacity"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  onClick={handleSaveKey}
                  disabled={!keyInput.trim() || saving}
                  className="px-6 py-3 rounded-lg bg-primary/20 text-primary border border-primary/30 font-display text-[11px] tracking-widest uppercase hover:bg-primary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] text-primary/60 hover:text-primary transition-colors font-display tracking-widest uppercase"
              >
                <ExternalLink size={10} />
                Get your free API key from Google AI Studio
              </a>
            </div>
          </div>

          {/* Theme Section */}
          <div className="glass-container p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2">
              <Palette className="text-primary" size={20} />
              <h3 className="font-display tracking-[0.2em] text-sm uppercase">Aesthetic Configuration</h3>
            </div>

            {/* Core Themes */}
            <div>
              <span className="meta-label text-[9px] tracking-widest opacity-40 mb-3 block">CORE THEMES</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {coreThemes.map((theme) => (
                  <ThemeCard key={theme.id} theme={theme} />
                ))}
              </div>
            </div>

            {/* Light Clinical Themes */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sun size={12} className="opacity-40" />
                <span className="meta-label text-[9px] tracking-widest opacity-40">CLINICAL LIGHT</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {lightThemes.map((theme) => (
                  <ThemeCard key={theme.id} theme={theme} />
                ))}
              </div>
            </div>

            {/* Dark Clinical Themes */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Moon size={12} className="opacity-40" />
                <span className="meta-label text-[9px] tracking-widest opacity-40">CLINICAL DARK</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {darkThemes.map((theme) => (
                  <ThemeCard key={theme.id} theme={theme} />
                ))}
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
