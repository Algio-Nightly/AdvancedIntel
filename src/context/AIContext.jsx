import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';
import { generateText, streamText, createChat, MODELS, MODEL_LABELS } from '../services/ai';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

// Simple client-side encryption helper using UID as salt
const crypt = (text, salt) => {
  if (!text || !salt) return text;
  try {
    return btoa(text.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ salt.charCodeAt(i % salt.length))
    ).join(''));
  } catch (e) { return text; }
};

const decrypt = (encoded, salt) => {
  if (!encoded || !salt) return encoded;
  try {
    return atob(encoded).split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ salt.charCodeAt(i % salt.length))
    ).join('');
  } catch (e) { return encoded; }
};

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
        // Try LocalStorage first (Maximum Privacy)
        const localKey = localStorage.getItem(`ai_key_${currentUser.uid}`);
        if (localKey) {
          setApiKeyState(localKey);
          setKeyLoaded(true);
          return;
        }

        // Fallback to Firestore (Encrypted)
        const userRef = doc(db, 'Users', currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().geminiApiKeySecret) {
          const decrypted = decrypt(snap.data().geminiApiKeySecret, currentUser.uid);
          setApiKeyState(decrypted);
        } else if (snap.exists() && snap.data().geminiApiKey) {
          // Migration: Encrypt old plain keys
          const plain = snap.data().geminiApiKey;
          setApiKeyState(plain);
          await updateDoc(userRef, { 
            geminiApiKeySecret: crypt(plain, currentUser.uid),
            geminiApiKey: '' // Clear plain key
          });
        } else {
          setApiKeyState(import.meta.env.VITE_GEMINI_API_KEY || '');
        }
      } catch (err) {
        console.warn('[AI] Failed to load API key:', err);
        setApiKeyState(import.meta.env.VITE_GEMINI_API_KEY || '');
      } finally {
        setKeyLoaded(true);
      }
    }

    loadKey();
  }, [currentUser?.uid]);

  const saveApiKey = useCallback(async (newKey, persistLocal = false) => {
    if (!currentUser?.uid) return;
    try {
      if (persistLocal) {
        localStorage.setItem(`ai_key_${currentUser.uid}`, newKey);
        // Clear from cloud for max privacy
        const userRef = doc(db, 'Users', currentUser.uid);
        await updateDoc(userRef, { geminiApiKeySecret: '', geminiApiKey: '' });
      } else {
        localStorage.removeItem(`ai_key_${currentUser.uid}`);
        const userRef = doc(db, 'Users', currentUser.uid);
        const encrypted = crypt(newKey, currentUser.uid);
        await setDoc(userRef, { geminiApiKeySecret: encrypted, geminiApiKey: '' }, { merge: true });
      }
      
      setApiKeyState(newKey);
      chatSessionsRef.current.clear();
      toast.success(persistLocal ? 'API key saved locally to browser.' : 'API key saved securely to cloud.');
    } catch (err) {
      console.error('[AI] Failed to save API key:', err);
      toast.error('Failed to save API key.');
      throw err;
    }
  }, [currentUser?.uid]);

  const removeApiKey = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      localStorage.removeItem(`ai_key_${currentUser.uid}`);
      const userRef = doc(db, 'Users', currentUser.uid);
      await updateDoc(userRef, { geminiApiKeySecret: '', geminiApiKey: '' });
      setApiKeyState('');
      chatSessionsRef.current.clear();
      toast.success('API key purged from all storage.');
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
