import { NavContext } from './context/NavContext'
import { useWorkspace } from './hooks/useWorkspace'
import { AtriumDashboard } from './components/atrium/AtriumDashboard'
import { LatticeDashboard } from './components/lattice/LatticeDashboard'
import { EvidencePanel } from './components/evidence/EvidencePanel'

function App() {
  const workspace = useWorkspace()

  const centre =
    workspace.view === 'monitor' ? (
      <LatticeDashboard data={workspace.data} />
    ) : workspace.view === 'evidence' ? (
      <EvidencePanel
        docId={workspace.docId}
        namespace={workspace.namespace}
        claimId={workspace.highlight}
        onBack={() => workspace.go('monitor')}
      />
    ) : (
      <AtriumDashboard data={workspace.data} view={workspace.view} />
    )

  return (
    <NavContext.Provider
      value={{
        view: workspace.view,
        highlight: workspace.highlight,
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

export default App
