import type { Wallet } from '@/shared/contracts'
import { Button } from '@/shared/ui/button'
import type { CheckoutFormValues } from '../form-schema'
import { shortAddress } from '@/features/nft/editions'

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm">{value || '—'}</dd>
    </div>
  )
}

/** Etapa de revisão: os dados informados, somente leitura, antes de confirmar. */
export function ReviewPanel({
  values,
  wallet,
  onEdit,
}: {
  values: CheckoutFormValues
  wallet: Wallet | undefined
  onEdit: () => void
}) {
  return (
    <section aria-labelledby="review-title" className="grid gap-6">
      <div className="flex items-center justify-between">
        <h2 id="review-title" className="text-base font-bold">
          Revise seu pedido
        </h2>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Editar dados
        </Button>
      </div>

      <dl className="grid gap-4 bg-surface p-5 sm:grid-cols-2">
        <Item label="Nome de exibição" value={values.displayName} />
        <Item label="Nome de usuário" value={values.userName} />
        <Item label="Nome do perfil" value={values.profileName} />
        <Item label="E-mail" value={values.email} />
        <Item label="Código de indicação" value={values.referralCode} />
        <Item label="Rede" value={values.network} />
        <Item
          label="Carteira"
          value={wallet ? `${wallet.nickname} · ${wallet.type} · ${shortAddress(wallet.address)}${wallet.ensName ? ` · ${wallet.ensName}` : ''}` : ''}
        />
        <Item label="Conexão" value={wallet?.connected ? 'Conectada' : 'Desconectada'} />
        <div className="sm:col-span-2">
          <Item label="Observação do colecionador" value={values.note} />
        </div>
      </dl>
    </section>
  )
}
