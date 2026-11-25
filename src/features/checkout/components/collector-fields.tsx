import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { CheckoutFormValues } from '../form-schema'
import { Field, fieldA11y, inputClass } from './fields'

interface CollectorFieldsProps {
  register: UseFormRegister<CheckoutFormValues>
  errors: FieldErrors<CheckoutFormValues>
}

/** "Perfil do colecionador" do Figma: dados da compra, indicação e observação. */
export function CollectorFields({ register, errors }: CollectorFieldsProps) {
  return (
    <fieldset className="grid min-w-0 grid-cols-1 gap-4">
      <legend className="mb-3 text-base font-bold">Perfil do colecionador</legend>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="co-displayName" label="Nome de exibição" required error={errors.displayName?.message}>
          <input
            {...fieldA11y('co-displayName', errors.displayName?.message)}
            autoComplete="name"
            className={inputClass}
            {...register('displayName')}
          />
        </Field>
        <Field id="co-userName" label="Nome de usuário" required error={errors.userName?.message}>
          <input
            {...fieldA11y('co-userName', errors.userName?.message)}
            autoComplete="username"
            className={inputClass}
            {...register('userName')}
          />
        </Field>
        <Field id="co-profileName" label="Nome do perfil" required error={errors.profileName?.message}>
          <input
            {...fieldA11y('co-profileName', errors.profileName?.message)}
            className={inputClass}
            {...register('profileName')}
          />
        </Field>
        <Field id="co-email" label="E-mail" required error={errors.email?.message}>
          <input
            {...fieldA11y('co-email', errors.email?.message)}
            type="email"
            autoComplete="email"
            className={inputClass}
            {...register('email')}
          />
        </Field>
        <Field id="co-referral" label="Código de indicação" error={errors.referralCode?.message}>
          <input
            {...fieldA11y('co-referral', errors.referralCode?.message)}
            placeholder="Opcional"
            className={inputClass}
            {...register('referralCode')}
          />
        </Field>
      </div>

      <Field id="co-note" label="Observação do colecionador (opcional)" error={errors.note?.message}>
        <textarea
          {...fieldA11y('co-note', errors.note?.message)}
          rows={4}
          maxLength={500}
          className={`${inputClass} h-auto py-2`}
          {...register('note')}
        />
      </Field>
    </fieldset>
  )
}
