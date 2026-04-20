import React, { createContext, useContext, useState, useCallback } from 'react';
import { useFirebase } from '../hooks/useFirebase';

const NodeContext = createContext();

export function useNodes() {
  return useContext(NodeContext);
}

export function NodeProvider({ children }) {
  const { createNode, fetchNodesByParent, updateNodeWidgets, updateNodeMetadata: updateNodeMetadataFB, updateNodePosition, deleteNode, loading: fbLoading, error } = useFirebase();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadNodes = useCallback(async (parentId) => {
    setLoading(true);
    try {
      const data = await fetchNodesByParent(parentId);
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setNodes(data);
      return data;
    } catch (err) {
      console.error("Failed to load nodes", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchNodesByParent]);

  const addNode = async (parentId, title, type) => {
    const newNode = await createNode(parentId, title, type);
    if (newNode) {
      setNodes(prev => [newNode, ...prev]);
    }
    return newNode;
  };

  const removeNode = async (nodeId) => {
    await deleteNode(nodeId);
    setNodes(prev => prev.filter(n => n.id !== nodeId));
  };

  const updateWidgets = async (nodeId, widgets) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, widgets } : n));
    try {
      await updateNodeWidgets(nodeId, widgets);
    } catch (error) {
      console.error("Failed to update widgets in Firebase:", error);
    }
  };

  const updateMetadata = async (nodeId, metadata) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...metadata } : n));
    try {
      await updateNodeMetadataFB(nodeId, metadata);
    } catch (error) {
      console.error("Failed to update metadata in Firebase:", error);
    }
  };

  const updatePosition = async (nodeId, position) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, position } : n));
    try {
      await updateNodePosition(nodeId, position);
    } catch (error) {
      console.error("Failed to update position in Firebase:", error);
    }
  };

  return (
    <NodeContext.Provider value={{
      nodes,
      loading: loading || fbLoading,
      error,
      loadNodes,
      addNode,
      removeNode,
      updateWidgets,
      updateMetadata,
      updatePosition
    }}>
      {children}
    </NodeContext.Provider>
  );
}
