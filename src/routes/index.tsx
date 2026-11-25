import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { http } from '@/shared/api/http'

export const Route = createFileRoute('/')({
  component: HomePage,
})

// Verificação temporária da cadeia Axios -> MSW -> TanStack Query (removida na Etapa 03).
function HealthCheck() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: async ({ signal }) => {
      const res = await http.get<{ status: string }>('/health', { signal })
      return res.data
    },
  })

  if (isPending) return <span>verificando...</span>
  if (isError) return <span className="text-danger">falhou (mocks desligados?)</span>
  return <span className="text-accent-strong">{data.status}</span>
}

function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1200px] flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-widest">KURIO</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Ambiente configurado. A Home será implementada na etapa 03.
      </p>
      <p className="text-sm">
        Mocks (GET /api/health): <HealthCheck />
      </p>
      <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-accent">
        <Link to="/login">/login</Link>
        <Link to="/signup">/signup</Link>
        <Link to="/cart">/cart</Link>
        <Link to="/checkout">/checkout</Link>
        <Link to="/profile">/profile</Link>
        <Link to="/wallets">/wallets</Link>
        <Link to="/nft/$nftId" params={{ nftId: '1' }}>
          /nft/1
        </Link>
        <Link to="/order/$orderId" params={{ orderId: '1' }}>
          /order/1
        </Link>
      </nav>
    </main>
  )
}
