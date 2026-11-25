import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { getPageWindow } from '../search'

interface PaginationProps {
  page: number
  total: number
  pageSize: number
}

const itemClass = (active: boolean) =>
  cn(
    'flex h-8 w-8 items-center justify-center rounded border text-sm transition-colors',
    active
      ? 'border-accent bg-accent font-bold text-on-accent'
      : 'border-border text-foreground hover:border-accent hover:text-accent',
  )

/** Paginação por links: cada página é uma URL compartilhável. */
export function Pagination({ page, total, pageSize }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação" className="mt-12 flex justify-center gap-2 md:justify-end">
      {page > 1 ? (
        <Link
          from="/"
          search={(previous) => ({ ...previous, page: page - 1 })}
          aria-label="Página anterior"
          className={itemClass(false)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}

      {getPageWindow(page, totalPages).map((number) => (
        <Link
          key={number}
          from="/"
          search={(previous) => ({ ...previous, page: number })}
          aria-label={`Página ${number}`}
          aria-current={number === page ? 'page' : undefined}
          className={itemClass(number === page)}
        >
          {number}
        </Link>
      ))}

      {page < totalPages ? (
        <Link
          from="/"
          search={(previous) => ({ ...previous, page: page + 1 })}
          aria-label="Próxima página"
          className={itemClass(false)}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  )
}
