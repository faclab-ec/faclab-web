import { Component, ErrorInfo, ReactNode } from 'react'
import { HiOutlineExclamation } from 'react-icons/hi'
import Button from '@/components/ui/Button'

class ErrorBoundary extends Component<
    { children: ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: ReactNode }) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('ErrorBoundary:', error, info)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    role="alert"
                    className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
                >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-3xl text-red-500 dark:bg-red-500/10">
                        <HiOutlineExclamation />
                    </span>
                    <div>
                        <h1>Algo salió mal</h1>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">
                            La pantalla no se pudo mostrar. Vuelve a intentarlo;
                            si el problema sigue, recarga la página.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => window.location.reload()}>
                            Recargar
                        </Button>
                        <Button
                            variant="solid"
                            onClick={() => this.setState({ hasError: false })}
                        >
                            Reintentar
                        </Button>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}

export default ErrorBoundary
