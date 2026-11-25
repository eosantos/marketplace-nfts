import { z } from 'zod'
import { NftNetworkSchema } from '@/shared/contracts'

const emailField = z.string().trim().min(1, 'Informe seu e-mail.').email('Informe um e-mail válido.')

/** Dados do colecionador, carteira e rede (a tela de pagamento do Figma). */
export const checkoutFormSchema = z.object({
  displayName: z.string().trim().min(1, 'Informe o nome de exibição.').max(60, 'Use no máximo 60 caracteres.'),
  userName: z
    .string()
    .trim()
    .min(1, 'Informe o nome de usuário.')
    .max(40, 'Use no máximo 40 caracteres.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Use apenas letras, números e underscore.'),
  profileName: z.string().trim().min(1, 'Informe o nome do perfil.').max(60, 'Use no máximo 60 caracteres.'),
  email: emailField,
  // No Figma o código de indicação aparece com asterisco; no contrato ele é opcional (formato validado se preenchido).
  referralCode: z
    .string()
    .trim()
    .max(50, 'Use no máximo 50 caracteres.')
    .regex(/^[A-Za-z0-9_-]*$/, 'Use apenas letras, números, hífen e underscore.'),
  note: z.string().trim().max(500, 'Use no máximo 500 caracteres.'),
  walletId: z.string().min(1, 'Escolha uma carteira.'),
  network: NftNetworkSchema,
})

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>

export { walletFormSchema as newWalletFormSchema } from '@/features/wallets/schemas'
export type { WalletFormValues as NewWalletFormValues } from '@/features/wallets/schemas'
