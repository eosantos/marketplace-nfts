import { NFT_ORDER_LABELS, NftOrderBySchema, type NftOrderBy } from '@/shared/contracts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useCatalogNavigation } from '../use-catalog-navigation'

export function SortSelect({ value }: { value: NftOrderBy }) {
  const update = useCatalogNavigation()

  return (
    <div className="flex items-center gap-1 text-sm">
      <span id="sort-label">Ordenar por:</span>
      <Select
        value={value}
        onValueChange={(next) => {
          const parsed = NftOrderBySchema.safeParse(next)
          if (parsed.success) update({ orderBy: parsed.data })
        }}
      >
        <SelectTrigger
          aria-labelledby="sort-label"
          className="h-9 w-auto min-w-[190px] gap-2 border-0 bg-transparent px-2 text-sm"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {NftOrderBySchema.options.map((option) => (
            <SelectItem key={option} value={option}>
              {NFT_ORDER_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
