import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { parseApiError } from '@/shared/api/errors'
import { NftNetworkSchema, WalletTypeSchema, type Wallet } from '@/shared/contracts'
import { useCreateWallet } from '@/features/wallets/hooks'
import { Button } from '@/shared/ui/button'
import { newWalletFormSchema, type NewWalletFormValues } from '../form-schema'
import { Field, fieldA11y, inputClass } from './fields'

/** "Usar outra carteira?": cadastra uma carteira nova (secundária) sem sair do checkout. */
export function NewWalletForm({ onCreated }: { onCreated: (wallet: Wallet) => void }) {
  const createWallet = useCreateWallet()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<NewWalletFormValues>({
    resolver: zodResolver(newWalletFormSchema),
    defaultValues: { nickname: '', network: 'Ethereum', address: '', type: 'MetaMask', ensName: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const wallet = await createWallet.mutateAsync({
        nickname: values.nickname,
        network: values.network,
        address: values.address,
        type: values.type,
        ...(values.ensName ? { ensName: values.ensName } : {}),
        isPrimary: false,
      })
      onCreated(wallet)
    } catch (error) {
      const apiError = parseApiError(error)
      const addressError = apiError.fieldErrors?.find((item) => item.field === 'address')
      if (addressError) setError('address', { message: addressError.message })
      else setFormError(apiError.message)
    }
  })

  return (
    <div role="group" aria-label="Nova carteira" className="grid gap-4 border border-border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="nw-nickname" label="Apelido da carteira" required error={errors.nickname?.message}>
          <input {...fieldA11y('nw-nickname', errors.nickname?.message)} className={inputClass} {...register('nickname')} />
        </Field>
        <Field id="nw-network" label="Rede" required error={errors.network?.message}>
          <select {...fieldA11y('nw-network', errors.network?.message)} className={inputClass} {...register('network')}>
            {NftNetworkSchema.options.map((network) => (
              <option key={network} value={network}>
                {network}
              </option>
            ))}
          </select>
        </Field>
        <Field id="nw-address" label="Endereço da carteira" required error={errors.address?.message} className="sm:col-span-2">
          <input {...fieldA11y('nw-address', errors.address?.message)} placeholder="Endereço 0x da carteira" className={inputClass} {...register('address')} />
        </Field>
        <Field id="nw-type" label="Tipo de carteira" required error={errors.type?.message}>
          <select {...fieldA11y('nw-type', errors.type?.message)} className={inputClass} {...register('type')}>
            {WalletTypeSchema.options.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field id="nw-ens" label="Nome ENS (opcional)" error={errors.ensName?.message}>
          <input {...fieldA11y('nw-ens', errors.ensName?.message)} placeholder="nome.eth" className={inputClass} {...register('ensName')} />
        </Field>
      </div>

      {formError ? (
        <p role="alert" className="text-xs text-danger">
          {formError}
        </p>
      ) : null}

      <Button
        type="button"
        size="sm"
        className="justify-self-start"
        disabled={createWallet.isPending}
        onClick={() => {
          void onSubmit()
        }}
      >
        {createWallet.isPending ? 'Salvando...' : 'Salvar e usar esta carteira'}
      </Button>
    </div>
  )
}
