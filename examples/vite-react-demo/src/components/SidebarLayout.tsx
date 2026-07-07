import { useState } from 'react'
import { usePrinter, usePrinterConnection } from 'detonger-web-bt/react'

const navItems = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'print-text', label: 'Print Text', icon: '📝' },
  { id: 'print-image', label: 'Print Image', icon: '🖼️' },
  { id: 'print-canvas', label: 'Print Canvas', icon: '🎨' },
] as const

type NavItemId = typeof navItems[number]['id']

interface SidebarLayoutProps {
  children: React.ReactNode
  currentPage: NavItemId
  onNavigate: (page: NavItemId) => void
}

export function SidebarLayout({ children, currentPage, onNavigate }: SidebarLayoutProps) {
  const { printer, isConnected, deviceName, connectionStatus } = usePrinter()
  const { connect, disconnect, isConnecting, error, clearError } = usePrinterConnection()
  const [paperWidth, setPaperWidth] = useState(String(printer.getPaperWidth()))
  const [showPaperWidth, setShowPaperWidth] = useState(false)

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#28a745'
      case 'connecting': return '#ffc107'
      case 'printing': return '#17a2b8'
      case 'error': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected'
      case 'connecting': return 'Connecting...'
      case 'printing': return 'Printing...'
      case 'error': return 'Error'
      default: return 'Disconnected'
    }
  }

  const handlePaperWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPaperWidth(value)
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue > 0) {
      printer.setPaperWidth(numValue)
    }
  }

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.logo}>🖨️ Printer Demo</h2>
        </div>

        <div style={styles.connectionSection}>
          <div style={styles.connectionStatus}>
            <span style={{ ...styles.statusDot, backgroundColor: getStatusColor() }} />
            <span style={styles.statusText}>{getStatusText()}</span>
          </div>
          {deviceName && (
            <p style={styles.deviceName}>{deviceName}</p>
          )}

          {error && (
            <div style={styles.errorBox}>
              <p style={styles.errorText}>{error.message}</p>
              <button onClick={clearError} style={styles.closeErrorBtn}>×</button>
            </div>
          )}

          {!isConnected ? (
            <button
              onClick={connect}
              disabled={isConnecting}
              style={styles.connectButton}
            >
              {isConnecting ? 'Connecting...' : 'Connect to Printer'}
            </button>
          ) : (
            <div style={styles.connectedControls}>
              <button
                onClick={disconnect}
                style={styles.disconnectButton}
              >
                Disconnect
              </button>
              <button
                onClick={() => setShowPaperWidth(!showPaperWidth)}
                style={styles.settingsButton}
                title="Paper width settings"
              >
                ⚙️
              </button>
            </div>
          )}

          {showPaperWidth && isConnected && (
            <div style={styles.paperWidthSection}>
              <label style={styles.paperWidthLabel}>Paper width (px):</label>
              <input
                type="number"
                value={paperWidth}
                onChange={handlePaperWidthChange}
                min="1"
                max="500"
                style={styles.paperWidthInput}
              />
              <p style={styles.paperWidthHint}>Default: 56px</p>
            </div>
          )}
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => {
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : styles.navItemInactive),
                }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <main style={styles.main}>
        {children}
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#1e293b',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid #334155',
  },
  logo: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
  },
  connectionSection: {
    padding: '20px',
    borderBottom: '1px solid #334155',
  },
  connectedControls: {
    display: 'flex',
    gap: '8px',
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  statusText: {
    fontSize: '14px',
    fontWeight: 500,
  },
  deviceName: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: '0 0 12px 0',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    borderRadius: '6px',
    padding: '8px 12px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: '12px',
    margin: 0,
    flex: 1,
  },
  closeErrorBtn: {
    background: 'none',
    border: 'none',
    color: '#fca5a5',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0 4px',
  },
  connectButton: {
    width: '100%',
    padding: '10px 16px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  disconnectButton: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#64748b',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  settingsButton: {
    padding: '10px 12px',
    backgroundColor: '#475569',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  paperWidthSection: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#334155',
    borderRadius: '6px',
  },
  paperWidthLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#cbd5e1',
    marginBottom: '6px',
  },
  paperWidthInput: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #475569',
    borderRadius: '4px',
    backgroundColor: '#1e293b',
    color: '#fff',
    boxSizing: 'border-box',
  },
  paperWidthHint: {
    fontSize: '11px',
    color: '#94a3b8',
    margin: '6px 0 0 0',
  },
  nav: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.2s, color 0.2s',
    width: '100%',
  },
  navItemInactive: {
    backgroundColor: 'transparent',
    color: '#cbd5e1',
  },
  navItemActive: {
    backgroundColor: '#334155',
    color: '#fff',
  },
  navIcon: {
    fontSize: '16px',
  },
  main: {
    flex: 1,
    padding: '32px',
    backgroundColor: '#f8fafc',
    overflow: 'auto',
  },
}
