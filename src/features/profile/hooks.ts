import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks'
import { http } from '@/shared/api/http'
import { qk } from '@/shared/api/query-keys'
import { ProfileSchema } from '@/shared/contracts'

/** Perfil do usuário autenticado (usado para pré-preencher o checkout; a Etapa 08 o edita). */
export function useProfile() {
  const { user } = useSession()
  return useQuery({
    queryKey: qk.profile(user?.id ?? 'anonymous'),
    queryFn: async ({ signal }) => {
      const response = await http.get<unknown>('/profile', { signal })
      return ProfileSchema.parse(response.data)
    },
    enabled: user !== null,
  })
}
