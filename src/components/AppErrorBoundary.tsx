import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { useT } from '@/i18n'

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  const t = useT().crash
  return (
    <div className="mx-auto max-w-[40rem] px-4 py-16">
      <div className="glass card-sheen rounded-card border-rose-400/30 p-6">
        <h1 className="flex items-center gap-2 text-[1.15rem] font-semibold tracking-tight">
          <TriangleAlert size={19} className="text-rose-400" />
          {t.title}
        </h1>
        <p className="mt-2 text-ink-2 text-pretty">
          {t.body}
        </p>
        <pre className="mt-3 max-h-40 overflow-auto rounded-xl border border-line bg-card-2 p-3 text-[0.76rem] text-ink-3">
          {error instanceof Error ? error.message : String(error)}
        </pre>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={resetErrorBoundary}
            className="rounded-full border border-line bg-card px-4 py-2 text-[0.88rem] font-semibold transition hover:bg-card-2"
          >
            {t.tryAgain}
          </button>
          <button
            type="button"
            onClick={() => location.reload()}
            className="rounded-full px-4 py-2 text-[0.88rem] font-semibold text-ink-2 transition hover:text-ink"
          >
            {t.reload}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Keeps a render error from blanking the page, and clears query caches on retry. */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary FallbackComponent={Fallback} onReset={reset}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
