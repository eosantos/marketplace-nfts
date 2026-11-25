import { useId, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { applyApiFieldErrors } from '@/features/auth/form-errors'
import { Field, fieldA11y, inputClass } from '@/features/checkout/components/fields'
import { useCreateWallet, useUpdateWallet } from '@/features/wallets/hooks'
import { walletFormSchema, type WalletFormValues } from '@/features/wallets/schemas'
import { parseApiError } from '@/shared/api/errors'
import { NftNetworkSchema, WalletTypeSchema, type Wallet } from '@/shared/contracts'
import { Button } from '@/shared/ui/button'

interface WalletFormProps {
  /** Carteira existente (edição). Sem ela, cria uma nova com `isPrimary`. */
  wallet?: Wallet
  isPrimary: boolean
  onSaved?: () => void
  onCancel?: () => void
}

/** Formulário único para carteira principal e secundária (criar/editar). */
export function WalletForm({ wallet, isPrimary, onSaved, onCancel }: WalletFormProps) {
  const uid = useId()
  const create = useCreateWallet()
  const update = useUpdateWallet()
  const [formError, setFormError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending
  const id = (name: string) => `${uid}-${name}`

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      nickname: wallet?.nickname ?? '',
      network: wallet?.network ?? 'Ethereum',
      address: wallet?.address ?? '',
      type: wallet?.type ?? 'MetaMask',
      ensName: wallet?.ensName ?? '',
    },
  })

  const fail = (failure: unknown) => {
    const apiError = parseApiError(failure)
    const applied = applyApiFieldErrors(apiError, setError, {
      nickname: 'nickname',
      network: 'network',
      address: 'address',
      type: 'type',
      ensName: 'ensName',
    })
    if (!applied) setFormError(apiError.message)
  }

  const onSubmit = handleSubmit((values) => {
    setFormError(null)
    if (wallet) {
      update.mutate(
        {
          walletId: wallet.id,
          input: {
            nickname: values.nickname,
            network: values.network,
            address: values.address,
            type: values.type,
            ensName: values.ensName ? values.ensName : null,
          },
        },
        {
          onSuccess: (saved) => {
            reset({
              nickname: saved.nickname,
              network: saved.network,
              address: saved.address,
              type: saved.type,
              ensName: saved.ensName ?? '',
            })
            toast.success('Carteira salva.')
            onSaved?.()
          },
          onError: fail,
        },
      )
      return
    }
    create.mutate(
      {
        nickname: values.nickname,
        network: values.network,
        address: values.address,
        type: values.type,
        ...(values.ensName ? { ensName: values.ensName } : {}),
        isPrimary,
      },
      {
        onSuccess: () => {
          toast.success('Carteira adicionada.')
          onSaved?.()
        },
        onError: fail,
      },
    )
  })

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field id={id('nickname')} label="Apelido da carteira" required error={errors.nickname?.message}>
          <input {...fieldA11y(id('nickname'), errors.nickname?.message)} className={inputClass} {...register('nickname')} />
        </Field>
        <Field id={id('network')} label="Rede" required error={errors.network?.message}>
          <select {...fieldA11y(id('network'), errors.network?.message)} className={inputClass} {...register('network')}>
            {NftNetworkSchema.options.map((network) => (
              <option key={network} value={network}>
                {network}
              </option>
            ))}
          </select>
        </Field>
        <Field id={id('address')} label="Endereço da carteira" required error={errors.address?.message} className="md:col-span-2">
          <input
            {...fieldA11y(id('address'), errors.address?.message)}
            placeholder="0x..."
            autoComplete="off"
            spellCheck={false}
            className={inputClass}
            {...register('address')}
          />
        </Field>
        <Field id={id('type')} label="Tipo de carteira" required error={errors.type?.message}>
          <select {...fieldA11y(id('type'), errors.type?.message)} className={inputClass} {...register('type')}>
            {WalletTypeSchema.options.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field id={id('ens')} label="Nome ENS (opcional)" error={errors.ensName?.message}>
          <input {...fieldA11y(id('ens'), errors.ensName?.message)} placeholder="nome.eth" className={inputClass} {...register('ensName')} />
        </Field>
      </div>

      {formError ? (
        <p role="alert" className="text-xs text-danger">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 max-md:[&>button]:flex-1">
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando...' : 'Salvar carteira'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  )
}
