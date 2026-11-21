import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { startTelemetry } from '@shared/lib/telemetry'
import './index.css'

// Antes del render: los errores de la carga ya se escuchan (S7.3)
void startTelemetry()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
