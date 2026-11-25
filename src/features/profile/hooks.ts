import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionQueryOptions, useSession } from '@/features/auth/hooks'
import { qk } from '@/shared/api/query-keys'
import type { AuthResponse, Profile, ProfileUpdateInput } from '@/shared/contracts'
import {
  changePasswordRequest,
  fetchProfile,
  updateProfileRequest,
  uploadAvatarRequest,
} from './api'

/** Perfil do usuário autenticado (pré-preenche o checkout e é editado em /profile). */
export function useProfile() {
  const { user } = useSession()
  return useQuery({
    queryKey: qk.profile(user?.id ?? 'anonymous'),
    queryFn: ({ signal }) => fetchProfile(signal),
    enabled: user !== null,
  })
}

/** Grava o perfil devolvido pela API no cache do perfil e no usuário da sessão (header). */
function useApplyProfile() {
  const queryClient = useQueryClient()
  return (profile: Profile) => {
    queryClient.setQueryData<Profile>(qk.profile(profile.userId), profile)
    queryClient.setQueryData<AuthResponse>(sessionQueryOptions.queryKey, (old) =>
      old
        ? {
            ...old,
            user: {
              ...old.user,
              displayName: profile.displayName,
              userName: profile.userName,
              profileName: profile.profileName,
              ...(profile.avatar ? { avatar: profile.avatar } : { avatar: undefined }),
            },
          }
        : old,
    )
  }
}

export function useUpdateProfile() {
  const apply = useApplyProfile()
  return useMutation({
    mutationFn: (input: ProfileUpdateInput) => updateProfileRequest(input),
    onSuccess: apply,
  })
}

export function useUploadAvatar() {
  const apply = useApplyProfile()
  return useMutation({
    mutationFn: (file: File) => uploadAvatarRequest(file),
    onSuccess: apply,
  })
}

export function useRemoveAvatar() {
  const apply = useApplyProfile()
  return useMutation({
    mutationFn: () => updateProfileRequest({ avatar: null }),
    onSuccess: apply,
  })
}

/** Sucesso: a API revoga as OUTRAS sessões; a atual continua válida. */
export function useChangePassword() {
  return useMutation({
    mutationFn: changePasswordRequest,
  })
}
