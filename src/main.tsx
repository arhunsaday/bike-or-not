import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { TooltipProvider } from './components/ui/Tooltip'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
        {/* Sonner's default 356px plus its offsets overflows a 375px screen,
            and its default stacking order puts toasts over open dialogs. */}
        <Toaster
          position="bottom-center"
          style={{
            zIndex: 45,
            '--width': 'min(24rem, calc(100vw - 1.5rem))',
          } as React.CSSProperties}
          toastOptions={{
            className: 'glass !rounded-2xl !text-ink',
            style: { background: 'var(--bg)', color: 'var(--ink)', borderColor: 'var(--line)' },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
)
