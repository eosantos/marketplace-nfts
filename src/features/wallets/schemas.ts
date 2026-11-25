import { z } from 'zod'
import { NftNetworkSchema, WalletTypeSchema } from '@/shared/contracts'

/** Formulário de carteira (checkout e /wallets): mesmas regras do contrato. */
export const walletFormSchema = z.object({
  nickname: z.string().trim().min(1, 'Informe um apelido.').max(40, 'Use no máximo 40 caracteres.'),
  network: NftNetworkSchema,
  address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Use um endereço 0x com 40 caracteres hexadecimais.'),
  type: WalletTypeSchema,
  ensName: z
    .string()
    .trim()
    .max(60, 'Use no máximo 60 caracteres.')
    .regex(/^[a-zA-Z0-9-]+\.eth$/, 'Use um nome ENS válido, como nome.eth.')
    .or(z.literal('')),
})

export type WalletFormValues = z.infer<typeof walletFormSchema>
