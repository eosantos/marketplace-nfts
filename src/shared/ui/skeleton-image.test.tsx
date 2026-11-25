import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SkeletonImage } from './skeleton-image'

describe('SkeletonImage', () => {
  it('starts with the shimmer class and keeps the original classes and attributes', () => {
    const html = renderToStaticMarkup(
      <SkeletonImage src="/assets/nfts/ape-green.webp" alt="Macaco" width={258} height={300} className="h-full w-full" />,
    )
    expect(html).toContain('img-skeleton')
    expect(html).toContain('h-full w-full')
    expect(html).toContain('alt="Macaco"')
    expect(html).toContain('width="258"')
  })
})
