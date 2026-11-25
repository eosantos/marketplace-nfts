import * as React from 'react'
import { cn } from '@/shared/lib/utils'

const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted motion-reduce:animate-none',
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  )
}

export { Skeleton }
