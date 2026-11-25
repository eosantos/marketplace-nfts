/** Mostra pelo menos 2 casas decimais sem converter para número: "0" -> "0.00", "26.846" -> "26.846". */
export function padEth(value: string, minDecimals = 2): string {
  const [integer, fraction = ''] = value.split('.')
  return `${integer}.${fraction.padEnd(minDecimals, '0')}`
}
