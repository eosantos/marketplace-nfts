import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useUrlSearchQuery } from '../use-url-search-query'

/** Ícone de busca do header que abre um campo ligado ao parâmetro `q` da URL. */
export function HeaderSearch() {
  const { value, setValue } = useUrlSearchQuery()
  const [open, setOpen] = useState(value !== '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const close = () => {
    setValue('')
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      {open ? (
        <input
          ref={inputRef}
          type="search"
          aria-label="Buscar NFTs"
          placeholder="Buscar NFTs"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') close()
          }}
          className="h-8 w-44 rounded border border-border bg-transparent px-3 text-xs placeholder:text-muted-foreground focus-visible:border-accent"
        />
      ) : null}
      <button
        type="button"
        aria-label={open ? 'Fechar busca' : 'Abrir busca'}
        aria-expanded={open}
        onClick={() => {
          if (open) close()
          else setOpen(true)
        }}
        className="text-foreground transition-colors hover:text-accent"
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )
}
