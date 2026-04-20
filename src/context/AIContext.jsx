import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';
import { generateText, streamText, createChat, MODELS, MODEL_LABELS } from '../services/ai';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

const AIContext = createContext();

export function AIProvider({ children }) {
  const { currentUser } = useAuth();
  const [apiKey, setApiKeyState] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [keyLoaded, setKeyLoaded] = useState(false);
  const chatSessionsRef = useRef(new Map());

  // ─── Load API key from Firestore on mount / user change ───
  useEffect(() => {
    if (!currentUser?.uid) {
      setApiKeyState('');
      setKeyLoaded(true);
      return;
    }

    async function loadKey() {
      try {
        const userRef = doc(db, 'Users', currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().geminiApiKey) {
          setApiKeyState(snap.data().geminiApiKey);
        } else {
          setApiKeyState(import.meta.env.VITE_GEMINI_API_KEY || '');
        }
      } catch (err) {
        console.warn('[AI] Failed to load API key from Firestore:', err);
        setApiKeyState(import.meta.env.VITE_GEMINI_API_KEY || '');
      } finally {
        setKeyLoaded(true);
      }
    }

    loadKey();
  }, [currentUser?.uid]);

  const saveApiKey = useCallback(async (newKey) => {
    if (!currentUser?.uid) return;
    try {
      const userRef = doc(db, 'Users', currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        await updateDoc(userRef, { geminiApiKey: newKey });
      } else {
        await setDoc(userRef, { geminiApiKey: newKey }, { merge: true });
      }
      setApiKeyState(newKey);
      chatSessionsRef.current.clear();
      toast.success('API key saved to your profile.');
    } catch (err) {
      console.error('[AI] Failed to save API key:', err);
      toast.error('Failed to save API key.');
      throw err;
    }
  }, [currentUser?.uid]);

  const removeApiKey = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      const userRef = doc(db, 'Users', currentUser.uid);
      await updateDoc(userRef, { geminiApiKey: '' });
      setApiKeyState('');
      chatSessionsRef.current.clear();
      toast.success('API key removed from your profile.');
    } catch (err) {
      console.error('[AI] Failed to remove API key:', err);
      toast.error('Failed to remove API key.');
    }
  }, [currentUser?.uid]);

  const generate = useCallback(async (prompt, options = {}) => {
    if (!apiKey) throw new Error('No API key configured. Add your Gemini API key in Settings.');
    setIsProcessing(true);
    try {
      return await generateText(apiKey, prompt, options);
    } finally {
      setIsProcessing(false);
    }
  }, [apiKey]);

  const stream = useCallback(async (prompt, onChunk, options = {}) => {
    if (!apiKey) throw new Error('No API key configured. Add your Gemini API key in Settings.');
    setIsProcessing(true);
    try {
      return await streamText(apiKey, prompt, onChunk, options);
    } finally {
      setIsProcessing(false);
    }
  }, [apiKey]);

  const getChat = useCallback((sessionId, options = {}) => {
    if (!apiKey) throw new Error('No API key configured. Add your Gemini API key in Settings.');
    if (!chatSessionsRef.current.has(sessionId)) {
      chatSessionsRef.current.set(sessionId, createChat(apiKey, options));
    }
    return chatSessionsRef.current.get(sessionId);
  }, [apiKey]);

  const clearChat = useCallback((sessionId) => {
    if (chatSessionsRef.current.has(sessionId)) {
      chatSessionsRef.current.get(sessionId).clearHistory();
      chatSessionsRef.current.delete(sessionId);
    }
  }, []);

  const value = {
    generate, stream, getChat, clearChat,
    apiKey, saveApiKey, removeApiKey, keyLoaded,
    isProcessing,
    isAvailable: !!apiKey,
    MODELS, MODEL_LABELS,
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) throw new Error('useAI must be used within an AIProvider');
  return context;
}
