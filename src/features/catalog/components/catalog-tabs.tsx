import { Link } from '@tanstack/react-router'
import { NFT_TAB_LABELS, NftListTabSchema, type NftListTab } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'

export function CatalogTabs({ active }: { active: NftListTab }) {
  return (
    <nav aria-label="Abas do catálogo" className="flex gap-x-6 whitespace-nowrap max-md:-mx-1 max-md:gap-x-4 max-md:overflow-x-auto max-md:px-1">
      {NftListTabSchema.options.map((tab) => (
        <Link
          key={tab}
          from="/"
          search={(previous) => ({ ...previous, tab, page: 1 })}
          aria-current={tab === active ? 'true' : undefined}
          className={cn(
            'border-b-2 pb-1 text-sm transition-colors max-md:text-xs',
            tab === active
              ? 'border-accent font-bold text-accent'
              : 'border-transparent hover:text-accent',
          )}
        >
          {NFT_TAB_LABELS[tab]}
        </Link>
      ))}
    </nav>
  )
}
