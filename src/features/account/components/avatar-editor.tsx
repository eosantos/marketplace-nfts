import { useRef, useState } from 'react'
import { UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { parseApiError } from '@/shared/api/errors'
import { Button } from '@/shared/ui/button'
import { useRemoveAvatar, useUploadAvatar } from '@/features/profile/hooks'
import { AVATAR_TYPES, validateAvatarFile } from '@/features/profile/schemas'

/** Avatar: pré-validação local (tipo/tamanho) + a API tem a palavra final (erro no campo `avatar`). */
export function AvatarEditor({ avatar, name }: { avatar: string | undefined; name: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadAvatar()
  const remove = useRemoveAvatar()
  const [error, setError] = useState<string | null>(null)
  const busy = upload.isPending || remove.isPending

  const onFile = (file: File | undefined) => {
    if (!file) return
    setError(null)
    const local = validateAvatarFile(file)
    if (local) {
      setError(local)
      return
    }
    upload.mutate(file, {
      onSuccess: () => {
        toast.success('Avatar atualizado.')
      },
      onError: (failure) => {
        const apiError = parseApiError(failure)
        setError(apiError.fieldErrors?.find((item) => item.field === 'avatar')?.message ?? apiError.message)
      },
    })
  }

  return (
    <div className="grid gap-1.5">
      <span id="avatar-label" className="text-sm">
        Avatar
      </span>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface">
          {avatar ? (
            <img src={avatar} alt={`Avatar de ${name}`} className="h-full w-full object-cover" />
          ) : (
            <UserRound className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-labelledby="avatar-label"
          data-testid="avatar-input"
          onChange={(event) => {
            onFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          aria-describedby={error ? 'avatar-error' : 'avatar-hint'}
          onClick={() => inputRef.current?.click()}
        >
          {upload.isPending ? 'Enviando...' : 'Alterar'}
        </Button>
        {avatar ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => {
              setError(null)
              remove.mutate(undefined, {
                onSuccess: () => {
                  toast.success('Avatar removido.')
                },
                onError: (failure) => {
                  setError(parseApiError(failure).message)
                },
              })
            }}
          >
            Remover
          </Button>
        ) : null}
      </div>
      <p id="avatar-hint" className="text-xs text-muted-foreground">
        PNG, JPEG ou WebP, até 300 KB.
      </p>
      {error ? (
        <p id="avatar-error" role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
