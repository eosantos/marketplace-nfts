import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdateWallet, useWallets } from '@/features/wallets/hooks'
import { parseApiError } from '@/shared/api/errors'
import type { Wallet } from '@/shared/contracts'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { AccountLayout } from './account-layout'
import { WalletForm } from './wallet-form'

function SecondaryWallet({ wallet }: { wallet: Wallet }) {
  const update = useUpdateWallet()
  return (
    <li className="grid gap-4 border border-border p-4 md:p-5" aria-label={`Carteira ${wallet.nickname}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold">{wallet.nickname}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={update.isPending}
          onClick={() => {
            update.mutate(
              { walletId: wallet.id, input: { isPrimary: true } },
              {
                onSuccess: () => {
                  toast.success(`${wallet.nickname} agora é a carteira principal.`)
                },
                onError: (failure) => {
                  toast.error(parseApiError(failure).message)
                },
              },
            )
          }}
        >
          Tornar principal
        </Button>
      </div>
      <WalletForm wallet={wallet} isPrimary={false} />
    </li>
  )
}

export function WalletsPage() {
  const wallets = useWallets()
  const [adding, setAdding] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(true)

  const list = wallets.data ?? []
  const primary = list.find((wallet) => wallet.isPrimary)
  const secondaries = list.filter((wallet) => !wallet.isPrimary)
  const showNew = adding || (secondaries.length === 0 && !sameAsPrimary)

  return (
    <AccountLayout title="Carteiras">
      {wallets.isPending ? (
        <div className="grid gap-4" aria-busy="true" aria-label="Carregando carteiras">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : wallets.isError ? (
        <div role="alert" className="grid justify-items-start gap-3">
          <p className="text-sm text-danger">{parseApiError(wallets.error).message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void wallets.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="grid gap-10">
          <section aria-labelledby="primary-title" className="grid gap-4">
            <div>
              <h2 id="primary-title" className="text-lg font-bold">
                Carteira principal
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
              </p>
            </div>
            {primary ? (
              <WalletForm key={primary.id} wallet={primary} isPrimary />
            ) : (
              <WalletForm isPrimary />
            )}
          </section>

          <section aria-labelledby="secondary-title" className="grid gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="secondary-title" className="text-lg font-bold">
                  Carteira secundária
                </h2>
                {secondaries.length === 0 && !showNew ? (
                  <p className="mt-1 text-sm text-muted-foreground">Você ainda não adicionou uma carteira secundária.</p>
                ) : null}
              </div>
              {primary && secondaries.length > 0 && !adding ? (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-accent"
                  onClick={() => {
                    setAdding(true)
                  }}
                >
                  Adicionar
                </Button>
              ) : null}
            </div>

            {secondaries.length > 0 ? (
              <ul className="grid gap-4">
                {secondaries.map((wallet) => (
                  <SecondaryWallet key={wallet.id} wallet={wallet} />
                ))}
              </ul>
            ) : null}

            {primary && secondaries.length === 0 ? (
              <fieldset className="grid gap-2">
                <legend className="sr-only">Carteira secundária</legend>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="secondary-mode"
                    checked={sameAsPrimary}
                    onChange={() => {
                      setSameAsPrimary(true)
                    }}
                    className="accent-[var(--color-accent)]"
                  />
                  Igual à carteira principal
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="secondary-mode"
                    checked={!sameAsPrimary}
                    onChange={() => {
                      setSameAsPrimary(false)
                    }}
                    className="accent-[var(--color-accent)]"
                  />
                  Adicionar
                </label>
              </fieldset>
            ) : null}

            {primary && showNew ? (
              <div className="border border-border p-4 md:p-5">
                <WalletForm
                  isPrimary={false}
                  onSaved={() => {
                    setAdding(false)
                    setSameAsPrimary(true)
                  }}
                  onCancel={() => {
                    setAdding(false)
                    setSameAsPrimary(true)
                  }}
                />
              </div>
            ) : null}
          </section>
        </div>
      )}
    </AccountLayout>
  )
}
