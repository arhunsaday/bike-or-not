import { Bookmark, BookmarkPlus, Check, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { routeKey, useSettings } from '@/store/settings'

/** Quick-switch between the commutes you actually ride. */
export function SavedRoutes() {
  const { from, to, routes } = useSettings()
  const saveCurrentRoute = useSettings((s) => s.saveCurrentRoute)
  const loadRoute = useSettings((s) => s.loadRoute)
  const deleteRoute = useSettings((s) => s.deleteRoute)

  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')

  const currentId = routeKey({ from, to })
  const alreadySaved = routes.some((r) => r.id === currentId)
  const canSave = Boolean(from && to) && !alreadySaved

  if (!routes.length && !canSave) return null

  function save() {
    saveCurrentRoute(name)
    toast.success(`Saved “${name.trim() || `${from!.name} → ${to!.name}`}”`)
    setNaming(false)
    setName('')
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line-soft pt-3">
      <Bookmark size={13} className="text-ink-3" />

      {routes.map((r) => {
        const active = r.id === currentId
        return (
          <span
            key={r.id}
            className="group flex items-center rounded-full border bg-card-2 text-[0.78rem] transition"
            style={{ borderColor: active ? 'var(--verdict)' : 'var(--line-soft)' }}
          >
            <button
              type="button"
              onClick={() => loadRoute(r.id)}
              className="max-w-[13rem] truncate py-1 pl-2.5 pr-1.5 text-ink-2 transition hover:text-ink"
              title={`${r.from.name} → ${r.to.name}`}
            >
              {r.name}
            </button>
            <button
              type="button"
              onClick={() => deleteRoute(r.id)}
              aria-label={`Delete ${r.name}`}
              className="rounded-full p-1 pr-2 text-ink-3 opacity-0 transition hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
            >
              <X size={11} />
            </button>
          </span>
        )
      })}

      {naming ? (
        <span className="flex items-center gap-1 rounded-full border border-verdict bg-card px-2 py-0.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape') setNaming(false)
            }}
            placeholder={from && to ? `${from.name} → ${to.name}` : 'Name'}
            maxLength={40}
            className="w-40 bg-transparent py-0.5 text-[0.78rem] outline-none placeholder:text-ink-3"
          />
          <button type="button" onClick={save} aria-label="Save route"
                  className="rounded-full p-1 text-verdict transition hover:brightness-125">
            <Check size={13} />
          </button>
        </span>
      ) : canSave ? (
        <button
          type="button"
          onClick={() => setNaming(true)}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-line px-2.5 py-1 text-[0.78rem] text-ink-3 transition hover:border-verdict hover:text-ink"
        >
          <BookmarkPlus size={12} />
          Save this route
        </button>
      ) : null}
    </div>
  )
}
