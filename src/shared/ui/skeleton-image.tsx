import { useCallback, useState, type ImgHTMLAttributes, type SyntheticEvent } from 'react'
import { cn } from '@/shared/lib/utils'

/**
 * `<img>` com shimmer no próprio elemento enquanto a imagem carrega. Não cria wrapper nem altera o
 * layout (mesmas classes e dimensões, sem CLS) e não esconde a imagem: o LCP não é atrasado.
 * Em erro de carregamento o shimmer também para (o `alt` continua visível ao leitor de tela).
 */
export function SkeletonImage({ className, src, onLoad, onError, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  // Guarda QUAL src terminou: ao trocar a imagem (galeria) o shimmer volta sozinho.
  const [settled, setSettled] = useState<string | undefined>(undefined)
  const done = settled === src

  // Imagem já em cache pode concluir antes do React anexar o onLoad.
  const ref = useCallback(
    (node: HTMLImageElement | null) => {
      if (node?.complete && node.naturalWidth > 0) setSettled(src)
    },
    [src],
  )

  return (
    <img
      ref={ref}
      src={src}
      className={cn(!done && 'img-skeleton', className)}
      onLoad={(event: SyntheticEvent<HTMLImageElement>) => {
        setSettled(src)
        onLoad?.(event)
      }}
      onError={(event: SyntheticEvent<HTMLImageElement>) => {
        setSettled(src)
        onError?.(event)
      }}
      {...props}
    />
  )
}
