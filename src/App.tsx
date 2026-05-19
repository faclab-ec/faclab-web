import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@shared/lib/react-query'
import Theme from '@/components/template/Theme'
import Layout from '@/components/layouts'
import NavigationBinder from '@/components/route/NavigationBinder'
import AuthBootstrap from '@/components/AuthBootstrap'
import ErrorBoundary from '@/components/ErrorBoundary'
import mockServer from './mock'
import appConfig from '@/configs/app.config'
import './locales'
import '@/configs/zod.config'

const environment = process.env.NODE_ENV

/**
 * Set enableMock(Default false) to true at configs/app.config.js
 * If you wish to enable mock api
 */
if (environment !== 'production' && appConfig.enableMock) {
    mockServer({ environment })
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <NavigationBinder />
                <Theme>
                    <AuthBootstrap>
                        <ErrorBoundary>
                            <Layout />
                        </ErrorBoundary>
                    </AuthBootstrap>
                </Theme>
            </BrowserRouter>
        </QueryClientProvider>
    )
}

export default App
