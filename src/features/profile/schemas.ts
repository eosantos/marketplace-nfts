import { z } from 'zod'

export const AVATAR_MAX_BYTES = 300 * 1024
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export const profileFormSchema = z.object({
  displayName: z.string().trim().min(1, 'Informe o nome de exibição.').max(60, 'Use até 60 caracteres.'),
  userName: z
    .string()
    .trim()
    .min(1, 'Informe o nome de usuário.')
    .max(40, 'Use até 40 caracteres.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Use apenas letras, números e underscore.'),
  profileName: z.string().trim().min(1, 'Informe o nome do perfil.').max(60, 'Use até 60 caracteres.'),
})

export type ProfileFormValues = z.infer<typeof profileFormSchema>

export const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    newPassword: z
      .string()
      .min(8, 'A nova senha deve ter ao menos 8 caracteres.')
      .max(128, 'Use até 128 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  })

export type PasswordFormValues = z.infer<typeof passwordFormSchema>

/** Validação prévia do arquivo (a API valida de novo e é a fonte da verdade). */
export function validateAvatarFile(file: Pick<File, 'type' | 'size'>): string | null {
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
    return 'Use uma imagem PNG, JPEG ou WebP.'
  }
  if (file.size > AVATAR_MAX_BYTES) return 'A imagem deve ter no máximo 300 KB.'
  return null
}
