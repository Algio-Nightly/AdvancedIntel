import { useState, useCallback } from 'react';
import { db } from '../services/firebase';
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export function useFirebase() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. PROJECT MANAGEMENT
  const createProject = useCallback(async (title, theme = 'clinical-mint') => {
    if (!currentUser) return null;
    setLoading(true);
    try {
      const newProjectRef = doc(collection(db, "Projects"));
      const projectData = {
        projectId: newProjectRef.id,
        uid: currentUser.uid,
        title,
        theme,
        timestamps: {
          createdAt: serverTimestamp(),
          lastAccessed: serverTimestamp(),
        },
        metrics: {
          totalNodes: 0,
          totalEdges: 0,
          synthesisRatio: 0.0,
          orphanCount: 0
        },
        prerequisites: []
      };
      await setDoc(newProjectRef, projectData);
      return projectData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const deleteProject = useCallback(async (projectId) => {
    if (!currentUser || !projectId) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "Projects", projectId));
      await deleteDoc(doc(db, "Workspaces", projectId));
      // Optionally delete all nodes associated with this parent
      const q = query(collection(db, "Nodes"), where("parentId", "==", projectId));
      const snap = await getDocs(q);
      const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const updateProjectMetrics = useCallback(async (projectId, metrics) => {
    if (!currentUser || !projectId) return;
    try {
      const projectRef = doc(db, "Projects", projectId);
      await updateDoc(projectRef, { 
        metrics,
        "timestamps.lastAccessed": serverTimestamp() 
      });
    } catch (err) {
      console.error("Failed to update project metrics:", err);
    }
  }, [currentUser]);

  const fetchProjects = useCallback(async () => {
    if (!currentUser) return [];
    setLoading(true);
    try {
      const q = query(collection(db, "Projects"), where("uid", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const projects = [];
      querySnapshot.forEach((doc) => {
        projects.push(doc.data());
      });
      return projects;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // 2. WORKSPACE DATA MANAGEMENT (Generic Data Payload)
  const saveWorkspaceData = useCallback(async (projectId, dataPayload) => {
    if (!currentUser || !projectId) return;
    setLoading(true);
    try {
      // Save generic data payload to a 'Workspaces' collection
      const workspaceRef = doc(db, "Workspaces", projectId);
      await setDoc(workspaceRef, {
        projectId,
        uid: currentUser.uid,
        data: dataPayload,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // Update project lastAccessed trigger
      const projectRef = doc(db, "Projects", projectId);
      await updateDoc(projectRef, { "timestamps.lastAccessed": serverTimestamp() });

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const loadWorkspaceData = useCallback(async (projectId) => {
    if (!currentUser || !projectId) return null;
    setLoading(true);
    try {
      const workspaceRef = doc(db, "Workspaces", projectId);
      const workspaceSnap = await getDoc(workspaceRef);
      if (workspaceSnap.exists()) {
        return workspaceSnap.data().data || {};
      }
      return {};
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // 3. PROFILE DATA
  const updateUserProfile = useCallback(async (profileData) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userRef = doc(db, "Users", currentUser.uid);
      await setDoc(userRef, profileData, { merge: true });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // 4. LIBRARY ARCHIVE (Metadata Layer)
  const saveDocumentMetadata = useCallback(async (fileData) => {
    if (!currentUser) return null;
    setLoading(true);
    try {
      const newDocRef = doc(collection(db, "LibraryArchive"));
      const record = {
        id: newDocRef.id,
        uid: currentUser.uid,
        fileName: fileData.name,
        fileSize: fileData.size,
        type: fileData.type,
        uploadedAt: serverTimestamp(),
      };
      await setDoc(newDocRef, record);
      return record;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchDocumentsMetadata = useCallback(async () => {
    if (!currentUser) return [];
    setLoading(true);
    try {
      const q = query(collection(db, "LibraryArchive"), where("uid", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push(doc.data());
      });
      return docs;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const deleteDocumentMetadata = useCallback(async (docId) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const docRef = doc(db, "LibraryArchive", docId);
      await updateDoc(docRef, { deleted: true }); 
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const updateDocumentNotes = useCallback(async (docId, noteSlabs) => {
    if (!currentUser || !docId) return;
    try {
      const noteRef = doc(db, "DocumentNotes", `${currentUser.uid}_${docId}`);
      await setDoc(noteRef, {
        docId,
        uid: currentUser.uid,
        noteSlabs,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to update document notes:", err);
    }
  }, [currentUser]);

  const fetchDocumentNotes = useCallback(async (docId) => {
    if (!currentUser || !docId) return [];
    try {
      const noteRef = doc(db, "DocumentNotes", `${currentUser.uid}_${docId}`);
      const snap = await getDoc(noteRef);
      if (snap.exists()) {
        return snap.data().noteSlabs || [];
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch document notes:", err);
      return [];
    }
  }, [currentUser]);

  // 5. NODES MANAGEMENT (Projects / Library Collections)
  const createNode = useCallback(async (parentId, title, type = 'project_node') => {
    if (!currentUser) return null;
    setLoading(true);
    try {
      const newNodeRef = doc(collection(db, "Nodes"));
      const nodeData = {
        id: newNodeRef.id,
        uid: currentUser.uid,
        parentId,
        targetParentIds: [], // explicit graph parents (multiple allowed)
        color: 'border-outline-variant/30', // default neutral color
        dependencies: [], // array of { type, id, name }
        title,
        type,
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        widgets: [],
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      };
      await setDoc(newNodeRef, nodeData);
      return nodeData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchNodesByParent = useCallback(async (parentId) => {
    if (!currentUser) return [];
    setLoading(true);
    try {
      const q = query(collection(db, "Nodes"), where("parentId", "==", parentId));
      const querySnapshot = await getDocs(q);
      const nodes = [];
      querySnapshot.forEach((docSnap) => {
        nodes.push(docSnap.data());
      });
      return nodes;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchAllUserNodes = useCallback(async () => {
    if (!currentUser) return [];
    setLoading(true);
    try {
      const q = query(collection(db, "Nodes"), where("uid", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const nodes = [];
      querySnapshot.forEach((docSnap) => {
        nodes.push(docSnap.data());
      });
      return nodes;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const updateNodeWidgets = useCallback(async (nodeId, widgets) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const nodeRef = doc(db, "Nodes", nodeId);
      await updateDoc(nodeRef, { 
        widgets,
        lastUpdated: serverTimestamp()
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const updateNodeMetadata = useCallback(async (nodeId, metadata) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const nodeRef = doc(db, "Nodes", nodeId);
      await updateDoc(nodeRef, { 
        ...metadata,
        lastUpdated: serverTimestamp()
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const updateNodePosition = useCallback(async (nodeId, position) => {
    if (!currentUser) return;
    try {
      const nodeRef = doc(db, "Nodes", nodeId);
      await updateDoc(nodeRef, { 
        position,
        lastUpdated: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to update position:", err);
    }
  }, [currentUser]);

  const deleteNode = useCallback(async (nodeId) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const nodeRef = doc(db, "Nodes", nodeId);
      await deleteDoc(nodeRef);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);
  
  // 6. TELEMETRY HISTORICAL SNAPSHOTS
  const saveTelemetrySnapshot = useCallback(async (metrics) => {
    if (!currentUser) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const snapshotRef = doc(db, "Users", currentUser.uid, "TelemetrySnapshots", today);
      await setDoc(snapshotRef, {
        ...metrics,
        date: today,
        timestamp: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to save telemetry snapshot:", err);
    }
  }, [currentUser]);

  const fetchTelemetryHistory = useCallback(async () => {
    if (!currentUser) return [];
    try {
      const q = query(
        collection(db, "Users", currentUser.uid, "TelemetrySnapshots"),
        orderBy("timestamp", "desc"),
        limit(7)
      );
      const snap = await getDocs(q);
      const history = [];
      snap.forEach(d => history.push(d.data()));
      return history.reverse(); // Chronological order
    } catch (err) {
      console.error("Failed to fetch telemetry history:", err);
      return [];
    }
  }, [currentUser]);

  return {
    loading,
    error,
    createProject,
    deleteProject,
    updateProjectMetrics,
    fetchProjects,
    saveWorkspaceData,
    loadWorkspaceData,
    updateUserProfile,
    saveDocumentMetadata,
    fetchDocumentsMetadata,
    deleteDocumentMetadata,
    updateDocumentNotes,
    fetchDocumentNotes,
    createNode,
    fetchNodesByParent,
    fetchAllUserNodes,
    updateNodeWidgets,
    updateNodeMetadata,
    updateNodePosition,
    deleteNode,
    saveTelemetrySnapshot,
    fetchTelemetryHistory
  };
}
