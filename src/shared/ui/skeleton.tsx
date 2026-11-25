import * as React from 'react'
import { cn } from '@/shared/lib/utils'

/** Placeholder com brilho (shimmer). Dê as mesmas dimensões do conteúdo real para evitar CLS. */
const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn('shimmer rounded-md', className)} aria-hidden="true" {...props} />
}

export { Skeleton }
