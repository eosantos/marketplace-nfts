import { useState } from 'react'
import { parseApiError } from '@/shared/api/errors'
import { NftNetworkSchema, type NftNetwork, type Wallet } from '@/shared/contracts'
import { shortAddress } from '@/features/nft/editions'
import { useConnectWallet, useDisconnectWallet } from '@/features/wallets/hooks'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { Field, fieldA11y, inputClass } from './fields'
import { NewWalletForm } from './new-wallet-form'

interface WalletPickerProps {
  wallets: Wallet[] | undefined
  loading: boolean
  selectedId: string
  network: NftNetwork
  error: string | undefined
  onSelect: (walletId: string, network: NftNetwork) => void
  onNetworkChange: (network: NftNetwork) => void
}

/**
 * Carteiras cadastradas + rede + simulação de conexão, recusa e desconexão. O resultado da conexão
 * vem do servidor (cenário `wallet-refused` recusa); este componente só mostra o que a API respondeu.
 */
export function WalletPicker({ wallets, loading, selectedId, network, error, onSelect, onNetworkChange }: WalletPickerProps) {
  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const [useOther, setUseOther] = useState(false)

  const selected = wallets?.find((wallet) => wallet.id === selectedId)
  const busy = connect.isPending || disconnect.isPending
  const actionError = connect.isError ? parseApiError(connect.error).message : disconnect.isError ? parseApiError(disconnect.error).message : null

  return (
    <fieldset className="grid min-w-0 grid-cols-1 gap-4">
      <legend className="mb-3 text-base font-bold">
        Carteira e rede
        <span className="ml-0.5 text-danger" aria-hidden="true">
          *
        </span>
      </legend>

      {loading ? (
        <div role="status" aria-label="Carregando carteiras" className="grid gap-2">
          <Skeleton className="h-[68px] w-full" />
          <Skeleton className="h-[68px] w-full" />
        </div>
      ) : wallets && wallets.length > 0 ? (
        <div role="radiogroup" aria-label="Carteiras cadastradas" className="grid grid-cols-1 gap-2">
          {wallets.map((wallet) => (
            <label key={wallet.id} className="relative block cursor-pointer">
              <input
                type="radio"
                name="wallet"
                value={wallet.id}
                checked={wallet.id === selectedId}
                onChange={() => {
                  connect.reset()
                  disconnect.reset()
                  onSelect(wallet.id, wallet.network)
                }}
                className="peer sr-only"
              />
              <div className="flex items-center justify-between gap-3 border border-border bg-surface p-3 transition-colors peer-checked:border-accent peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {wallet.nickname}
                    {wallet.isPrimary ? <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-[10px] text-on-accent">Principal</span> : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {wallet.type} · {shortAddress(wallet.address)}
                    {wallet.ensName ? ` · ${wallet.ensName}` : ''} · Rede {wallet.network}
                  </p>
                </div>
                <span className={cn('shrink-0 text-xs', wallet.connected ? 'text-accent-strong' : 'text-muted-foreground')}>
                  {wallet.connected ? 'Conectada' : 'Desconectada'}
                </span>
              </div>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Você ainda não tem carteiras. Marque “Usar outra carteira?” para cadastrar uma.</p>
      )}

      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}

      {selected ? (
        <div className="flex flex-wrap items-center gap-3">
          {selected.connected ? (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => { disconnect.mutate(selected.id) }}>
              {disconnect.isPending ? 'Desconectando...' : 'Desconectar carteira'}
            </Button>
          ) : (
            <Button type="button" size="sm" disabled={busy} onClick={() => { connect.mutate(selected.id) }}>
              {connect.isPending ? 'Conectando...' : 'Conectar carteira'}
            </Button>
          )}
          <p role="status" className="text-xs text-muted-foreground">
            {connect.isPending ? 'Aguardando a aprovação na carteira...' : selected.connected ? 'Carteira conectada.' : 'Conecte a carteira para continuar.'}
          </p>
        </div>
      ) : null}

      {actionError ? (
        <p role="alert" className="text-xs text-danger">
          {actionError}
        </p>
      ) : null}

      <Field id="co-network" label="Rede" required>
        <select
          {...fieldA11y('co-network', undefined)}
          value={network}
          onChange={(event) => {
            const parsed = NftNetworkSchema.safeParse(event.target.value)
            if (parsed.success) onNetworkChange(parsed.data)
          }}
          className={inputClass}
        >
          {NftNetworkSchema.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useOther}
          onChange={(event) => {
            setUseOther(event.target.checked)
          }}
          className="h-4 w-4 accent-[var(--color-accent)]"
        />
        Usar outra carteira?
      </label>

      {useOther ? (
        <NewWalletForm
          onCreated={(wallet) => {
            setUseOther(false)
            onSelect(wallet.id, wallet.network)
          }}
        />
      ) : null}
    </fieldset>
  )
}
