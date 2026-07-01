import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { NavContext } from './context/NavContext'
import { useWorkspace } from './hooks/useWorkspace'
import { AtriumDashboard } from './components/atrium/AtriumDashboard'
import { LatticeDashboard } from './components/lattice/LatticeDashboard'
import { EvidencePanel } from './components/evidence/EvidencePanel'
import { AskPanel } from './components/query/AskPanel'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Login } from './pages/Login'

function AppRoutes() {
  const workspace = useWorkspace()

  const centre =
    workspace.view === 'monitor' ? (
      <LatticeDashboard data={workspace.data} />
    ) : workspace.view === 'evidence' ? (
      <EvidencePanel
        docId={workspace.backendDocId}
        namespace={workspace.namespace}
        claimId={workspace.highlight}
        onBack={() => workspace.go('monitor')}
      />
    ) : workspace.view === 'ask' ? (
      <AskPanel
        docId={workspace.backendDocId}
        namespace={workspace.namespace}
        onBack={() => workspace.go('monitor')}
        onGoEvidence={(nodeId) => workspace.go('evidence', nodeId)}
      />
    ) : (
      <AtriumDashboard data={workspace.data} view={workspace.view} />
    )

  return (
    <NavContext.Provider
      value={{
        view: workspace.view,
        highlight: workspace.highlight,
        docId: workspace.docId,
        listFilter: workspace.listFilter,
        showSources: workspace.showSources,
        setListFilter: workspace.setListFilter,
        go: workspace.go,
        selectRun: workspace.selectRun,
        toggleSources: workspace.toggleSources,
      }}
    >
      {centre}
    </NavContext.Provider>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppRoutes />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
