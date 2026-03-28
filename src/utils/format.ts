export function formatRupiah(value: number | null | undefined, showMillion: boolean = true): string {
  const v = value ?? 0;
  if (showMillion && Math.abs(v) >= 1000000) {
    return `Rp ${(v / 1000000).toFixed(1)}M`;
  }
  return `Rp ${v.toLocaleString('id-ID')}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('id-ID');
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
