import { z } from 'zod'

const emailField = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .email('Informe um e-mail válido.')

export const loginFormSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Informe sua senha.'),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>

export const signupFormSchema = z
  .object({
    userName: z
      .string()
      .trim()
      .min(1, 'Informe um nome de usuário.')
      .max(40, 'Use no máximo 40 caracteres.')
      .regex(/^[a-zA-Z0-9_]+$/, 'Use apenas letras, números e underscore.'),
    email: emailField,
    password: z
      .string()
      .min(8, 'A senha deve ter ao menos 8 caracteres.')
      .max(128, 'Use no máximo 128 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem.',
  })

export type SignupFormValues = z.infer<typeof signupFormSchema>
