import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './auth/authConfig.js'
import { UserProvider } from './context/UserContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import './index.css'
import App from './App.jsx'

const msalInstance = new PublicClientApplication(msalConfig)

msalInstance.initialize().then(() => {
  msalInstance.handleRedirectPromise().catch((error) => {
    console.error('Error procesando redirect:', error)
  })

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ThemeProvider>
        <MsalProvider instance={msalInstance}>
          <UserProvider>
            <App />
          </UserProvider>
        </MsalProvider>
      </ThemeProvider>
    </StrictMode>,
  )
})
