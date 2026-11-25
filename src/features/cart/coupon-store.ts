// Cupom aplicado, por usuário, em sessionStorage: sobrevive ao refresh do carrinho e é lido pelo
// checkout (Etapa 07) para pedir a mesma cotação. Nunca é compartilhado entre usuários.
const couponKey = (userId: string) => `kurio:coupon:${userId}`

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage
  } catch {
    return null
  }
}

export function getCoupon(userId: string): string | null {
  try {
    const value = storage()?.getItem(couponKey(userId))
    return value && value.trim() !== '' ? value : null
  } catch {
    return null
  }
}

export function setCoupon(userId: string, code: string | null): void {
  try {
    if (code && code.trim() !== '') storage()?.setItem(couponKey(userId), code.trim())
    else storage()?.removeItem(couponKey(userId))
  } catch {
    // Sem sessionStorage: o cupom vale só enquanto a página estiver aberta.
  }
}
