import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useFirebase } from '../hooks/useFirebase';

const LibraryContext = createContext();

export function useLibrary() {
  return useContext(LibraryContext);
}

export function LibraryProvider({ children }) {
  const { fetchDocumentsMetadata, saveDocumentMetadata, deleteDocumentMetadata, updateDocumentNotes, fetchDocumentNotes, loading: fbLoading, error } = useFirebase();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDocumentsMetadata();
      const active = data.filter(d => !d.deleted);
      active.sort((a, b) => (b.uploadedAt?.seconds || 0) - (a.uploadedAt?.seconds || 0));
      setDocuments(active);
    } catch (err) {
      console.error("Failed to load library sync", err);
    } finally {
      setLoading(false);
    }
  }, [fetchDocumentsMetadata]);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  return (
    <LibraryContext.Provider value={{
      documents,
      loading: loading || fbLoading,
      error,
      refreshDocuments,
      saveDocumentMetadata,
      deleteDocumentMetadata,
      updateDocumentNotes,
      fetchDocumentNotes
    }}>
      {children}
    </LibraryContext.Provider>
  );
}
