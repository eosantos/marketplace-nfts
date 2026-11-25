import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import type { Order } from '@/shared/contracts'
import { Button } from '@/shared/ui/button'
import type { QuoteChange } from '../quote-diff'

/** Pedido criado e aguardando a rede. Recarregar a página é seguro: a compra não se repete. */
export function PendingOrder({ orderId }: { orderId: string }) {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="grid justify-items-center gap-4 bg-surface px-6 py-16 text-center"
    >
      <Loader2 className="h-10 w-10 animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />
      <h2 className="text-xl font-bold">Processando seu pagamento</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Estamos aguardando a confirmação na rede. Você pode recarregar a página ou perder a conexão: o pedido{' '}
        <span className="font-bold text-foreground">{orderId}</span> continua em andamento e não será duplicado.
      </p>
    </section>
  )
}

/** Retomada depois de um refresh/timeout: reenviamos a mesma requisição com a mesma chave. */
export function RecoveringOrder() {
  return (
    <section role="status" aria-live="polite" aria-busy="true" className="grid justify-items-center gap-4 bg-surface px-6 py-16 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />
      <h2 className="text-xl font-bold">Verificando seu pedido</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Não recebemos a resposta do envio. Estamos confirmando com o servidor, sem criar uma nova compra.
      </p>
    </section>
  )
}

export function UnreachableOrder({ onRetry, busy }: { onRetry: () => void; busy: boolean }) {
  return (
    <section role="alert" className="grid justify-items-center gap-4 border border-danger/50 bg-surface px-6 py-12 text-center">
      <h2 className="text-xl font-bold">Não conseguimos confirmar o envio</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        O servidor não respondeu. Seu pedido pode ter sido criado, mas reenviar é seguro: usamos a mesma
        chave de idempotência e nenhuma compra será duplicada.
      </p>
      <Button onClick={onRetry} disabled={busy}>
        {busy ? 'Verificando...' : 'Verificar e reenviar'}
      </Button>
    </section>
  )
}

export function RefusedOrder({ order, onRetry }: { order: Order; onRetry: () => void }) {
  return (
    <section role="alert" className="grid justify-items-center gap-4 border border-danger/50 bg-surface px-6 py-12 text-center">
      <h2 className="text-xl font-bold text-danger">Pagamento recusado</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        O pagamento do pedido <span className="font-bold text-foreground">{order.id}</span> foi recusado na
        simulação. Nada foi cobrado e seus itens continuam no carrinho.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={onRetry}>Tentar novamente</Button>
        <Button asChild variant="outline">
          <Link to="/cart">Voltar ao carrinho</Link>
        </Button>
      </div>
    </section>
  )
}

/** Mudanças detectadas na revalidação: a compra só segue depois de uma NOVA confirmação do usuário. */
export function ChangesPanel({
  changes,
  onAccept,
  accepting,
  title = 'Os valores mudaram desde a sua revisão',
}: {
  changes: QuoteChange[]
  onAccept: () => void
  accepting: boolean
  title?: string
}) {
  return (
    <section role="alert" aria-labelledby="changes-title" className="grid gap-4 border border-accent bg-surface p-5">
      <h2 id="changes-title" className="text-base font-bold text-accent-strong">
        {title}
      </h2>
      <ul className="grid gap-2 text-sm">
        {changes.map((change, index) => (
          <li key={`${change.kind}-${index}`} className="flex gap-2">
            <span aria-hidden="true">•</span>
            <span>{change.message}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Revise os novos valores no resumo. Nada foi cobrado.</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onAccept} disabled={accepting}>
          {accepting ? 'Confirmando...' : 'Aceitar novos valores e confirmar'}
        </Button>
        <Button asChild variant="outline">
          <Link to="/cart">Voltar ao carrinho</Link>
        </Button>
      </div>
    </section>
  )
}

export function BlockedPanel({
  message,
  action,
}: {
  message: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <section role="alert" className="grid gap-4 border border-danger/50 bg-surface p-5">
      <h2 className="text-base font-bold text-danger">Não é possível confirmar a compra</h2>
      <p className="text-sm">{message}</p>
      <div className="flex flex-wrap gap-3">
        {action ? <Button onClick={action.onClick}>{action.label}</Button> : null}
        <Button asChild variant="outline">
          <Link to="/cart">Voltar ao carrinho</Link>
        </Button>
      </div>
    </section>
  )
}
