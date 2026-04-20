import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProjectProvider } from './context/ProjectContext';
import { LibraryProvider } from './context/LibraryContext';
import { NodeProvider } from './context/NodeContext';
import { AIProvider } from './context/AIContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Navbar from './components/ui/Navbar';
import Projects from './components/Projects';
import Library from './components/Library';
import Settings from './components/Settings';
import ProjectWorkspace from './components/ProjectWorkspace';
import { Toaster } from 'sonner';
import NodeWorkspace from './components/node/NodeWorkspace';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Toaster position="bottom-right" theme="dark" closeButton richColors />
        <AuthProvider>
        <div className="relative min-h-screen">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Secured Area */}
            <Route path="/*" element={
              <ProtectedRoute>
                <ProjectProvider>
                  <LibraryProvider>
                    <AIProvider>
                      <NodeProvider>
                        <Navbar />
                        <Routes>
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/projects" element={<Projects />} />
                          <Route path="/library" element={<Library />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/project/:id" element={<ProjectWorkspace />} />
                          <Route path="/node/:id" element={<NodeWorkspace />} />
                        </Routes>
                      </NodeProvider>
                    </AIProvider>
                  </LibraryProvider>
                </ProjectProvider>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  </ThemeProvider>
  );
}

export default App;
