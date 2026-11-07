'use client';
import { useState } from 'react';
import { equipamentoService, type EquipamentoDTO } from '@/lib/api/services';
import { getApiErrorMessage } from '@/lib/api/errorMessage';

export default function EquipmentQrLookup({ onSelect }: { onSelect: (equipment: EquipamentoDTO) => void }) {
  const [value, setValue] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  return <form className="space-y-2 rounded-xl border border-slate-200 bg-white p-4" onSubmit={async (event) => {
    event.preventDefault();
    if (!value.trim()) { setError('Informe o identificador QR.'); return; }
    setPending(true); setError('');
    try { onSelect(await equipamentoService.buscarPorQr(value.trim())); }
    catch (cause) { setError(getApiErrorMessage(cause, 'QR Code não encontrado ou inválido.')); }
    finally { setPending(false); }
  }}>
    <label htmlFor="equipment-qr-search" className="block text-sm font-semibold text-slate-700">Localizar por QR Code</label>
    <div className="flex gap-2"><input id="equipment-qr-search" value={value} onChange={(e) => setValue(e.target.value)} maxLength={100} required className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" /><button disabled={pending} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? 'Buscando…' : 'Localizar'}</button></div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </form>;
}
