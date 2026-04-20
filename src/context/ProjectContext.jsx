import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useFirebase } from '../hooks/useFirebase';

const ProjectContext = createContext();

export function useProjects() {
  return useContext(ProjectContext);
}

export function ProjectProvider({ children }) {
  const { fetchProjects, createProject, deleteProject, updateProjectMetrics, saveWorkspaceData, loadWorkspaceData, loading: fbLoading, error } = useFirebase();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProjects();
      data.sort((a, b) => {
         const tA = a.timestamps?.lastAccessed?.seconds || 0;
         const tB = b.timestamps?.lastAccessed?.seconds || 0;
         return tB - tA;
      });
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects sync", err);
    } finally {
      setLoading(false);
    }
  }, [fetchProjects]);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  return (
    <ProjectContext.Provider value={{
      projects,
      loading: loading || fbLoading,
      error,
      refreshProjects,
      createProject,
      deleteProject,
      updateProjectMetrics,
      saveWorkspaceData,
      loadWorkspaceData
    }}>
      {children}
    </ProjectContext.Provider>
  );
}
