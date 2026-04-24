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

export function formatPeriod(periodStr: string | null | undefined, language: string = 'id'): string {
  if (!periodStr) return '—';
  const [year, month] = periodStr.split('-');
  if (!year || !month) return periodStr;
  
  try {
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  } catch (e) {
    return periodStr;
  }
}
