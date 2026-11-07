export default function Pagination({ page, size, total, pages, loading, onPage, onSize }: {
  page: number; size: number; total: number; pages: number; loading?: boolean;
  onPage: (page: number) => void; onSize: (size: number) => void;
}) {
  return <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
    <span>{total} registro(s) · Página {pages ? page + 1 : 0} de {pages}</span>
    <div className="flex items-center gap-3">
      <label>Por página <select aria-label="Registros por página" value={size} onChange={(event) => onSize(Number(event.target.value))} className="ml-2 rounded border border-slate-300 bg-white p-1.5">{[10, 25, 50].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <button type="button" disabled={loading || page === 0} onClick={() => onPage(page - 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Anterior</button>
      <button type="button" disabled={loading || page + 1 >= pages} onClick={() => onPage(page + 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Próxima</button>
    </div>
  </nav>;
}
