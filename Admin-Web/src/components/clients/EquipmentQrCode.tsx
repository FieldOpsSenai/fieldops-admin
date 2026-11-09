'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';

export default function EquipmentQrCode({ value, name }: { value?: string; name: string }) {
  const [result, setResult] = useState<{ value: string; source?: string; error?: string } | null>(null);
  useEffect(() => {
    let active = true;
    if (value) {
      void QRCode.toString(value, { type: 'svg', errorCorrectionLevel: 'M', margin: 4 }).then((svg) => {
        if (active) setResult({ value, source: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` });
      }).catch(() => { if (active) setResult({ value, error: 'Não foi possível gerar a imagem do QR Code.' }); });
    }
    return () => { active = false; };
  }, [value]);
  if (!value) return <p className="text-sm text-slate-500">Este equipamento ainda não possui QR Code cadastrado.</p>;
  const current = result?.value === value ? result : null;
  return <section className="rounded-xl border border-slate-200 bg-white p-4 text-center" aria-label={`QR Code de ${name}`}>
    <h4 className="font-semibold text-slate-800">Identificação do equipamento</h4>
    {current?.source ? <>
      <Image unoptimized src={current.source} alt={`QR Code de ${name}`} width={208} height={208} className="mx-auto" />
      <a href={current.source} download={`fieldops-equipamento-${value.replace(/[^a-zA-Z0-9-]/g, '_')}.svg`} className="inline-block rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Baixar QR Code</a>
    </> : <p role="status" className="py-6 text-sm text-slate-500">{current?.error || 'Gerando QR Code…'}</p>}
    <p className="mt-3 break-all font-mono text-xs text-slate-600">{value}</p>
  </section>;
}
