'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import TopHeader from '@/components/layout/TopHeader';
import { inspecaoService, type ApiInspection } from '@/lib/api/services/inspecaoService';
import {
  revisaoService,
  type SnapshotItem,
  type InspectionAnswer,
  type InspectionEvidence,
} from '@/lib/api/services/revisaoService';
import { getApiErrorMessage } from '@/lib/api/errorMessage';
import { canReviewInspections } from '@/lib/auth/permissions';
import { inspectionStatusLabels } from '@/lib/inspections/status';
import { useSessionStore } from '@/stores/sessionStore';

type Detail = {
  inspection: ApiInspection;
  snapshot: SnapshotItem[];
  answers: InspectionAnswer[];
  evidence: InspectionEvidence[];
  failures: string[];
};
type Receipt = { approved: boolean; reason: string };

function dateLabel(value?: string) {
  if (!value) return 'Não informado';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}

function answerLabel(answer: InspectionAnswer | undefined, type: string) {
  if (!answer?.valor?.trim()) return 'Sem resposta';
  const value = answer.valor;
  if (['BOOLEAN', 'YES_NO'].includes(type)) {
    if (value.toLowerCase() === 'true') return 'Sim';
    if (value.toLowerCase() === 'false') return 'Não';
  }
  if (['CONFORMITY', 'CONFORME_NAO_CONFORME'].includes(type)) {
    if (['true', 'CONFORME', 'CONFORM'].includes(value)) return 'Conforme';
    if (['false', 'NAO_CONFORME', 'NON_CONFORM'].includes(value)) return 'Não conforme';
  }
  return value;
}

function EvidenceList({ evidence }: { evidence: InspectionEvidence[] }) {
  return (
    <ul className="mt-2 space-y-2">
      {evidence.map((photo) => (
        <li
          key={photo.id}
          className="break-words rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
        >
          <span className="font-semibold">{photo.nomeArquivo}</span>
          <span className="block text-slate-600">
            {photo.tipoConteudo} · {dateLabel(photo.dataUpload)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function InspectionDetailPage({ id }: { id: number }) {
  const session = useSessionStore((state) => state.session);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const savingRef = useRef(false);
  const confirmationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const inspection = await inspecaoService.buscarPorId(id, controller.signal);
        const [snapshot, answers, evidence] = await Promise.allSettled([
          revisaoService.snapshot(id, controller.signal),
          revisaoService.respostas(id, controller.signal),
          revisaoService.evidencias(id, controller.signal),
        ]);
        if (controller.signal.aborted) return;
        const failures: string[] = [];
        if (snapshot.status === 'rejected')
          failures.push(
            getApiErrorMessage(snapshot.reason, 'Não foi possível carregar o checklist.'),
          );
        if (answers.status === 'rejected')
          failures.push(
            `Respostas indisponíveis: ${getApiErrorMessage(answers.reason, 'verifique sua permissão e tente novamente.')}`,
          );
        if (evidence.status === 'rejected')
          failures.push(
            getApiErrorMessage(evidence.reason, 'Não foi possível carregar as evidências.'),
          );
        setDetail({
          inspection,
          snapshot: snapshot.status === 'fulfilled' ? snapshot.value : [],
          answers: answers.status === 'fulfilled' ? answers.value : [],
          evidence: evidence.status === 'fulfilled' ? evidence.value : [],
          failures,
        });
      } catch (failure) {
        if (!controller.signal.aborted)
          setError(getApiErrorMessage(failure, 'Não foi possível carregar a inspeção.'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id, revision]);

  useEffect(() => {
    if (confirming) confirmationRef.current?.focus();
  }, [confirming]);

  const inspection = detail?.inspection;
  const canReview = canReviewInspections(session?.profile);
  const dataReady = !!detail && !detail.failures.length && detail.snapshot.length > 0;
  const missingRequired = detail?.snapshot.some(
    (item) =>
      (item.obrigatorio &&
        !detail.answers.some(
          (answer) => answer.snapshotItemId === item.id && answer.valor?.trim(),
        )) ||
      (item.evidenciaObrigatoria &&
        !detail.evidence.some((photo) => photo.snapshotItemId === item.id)),
  );
  const canSubmit = canReview && dataReady && inspection?.status === 'COMPLETED' && !receipt;

  function reload() {
    setLoading(true);
    setError('');
    setDetail(null);
    setConfirming(false);
    setActionError('');
    setRevision((value) => value + 1);
  }

  function prepareDecision(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || savingRef.current) return;
    if (decision === 'reject' && !reason.trim()) {
      setActionError('Informe o motivo da reprovação.');
      return;
    }
    setActionError('');
    setConfirming(true);
  }

  async function submitDecision() {
    if (!canSubmit || !session || !confirming || savingRef.current) return;
    if (decision === 'approve' && missingRequired) return;
    savingRef.current = true;
    setSaving(true);
    setActionError('');
    try {
      // Reconsulta o estado para evitar decidir sobre uma inspeção já reaberta.
      const current = await inspecaoService.buscarPorId(id);
      if (current.status !== 'COMPLETED') {
        setDetail((previous) => (previous ? { ...previous, inspection: current } : previous));
        throw new Error('A inspeção mudou de estado. Atualize os dados antes de revisar.');
      }
      const approved = decision === 'approve';
      const result = await revisaoService.revisar(id, {
        supervisorId: Number(session.userId),
        aprovado: approved,
        motivoReprovacao: reason,
      });
      setDetail((previous) =>
        previous
          ? {
              ...previous,
              inspection: {
                ...previous.inspection,
                status: result.status === 'CONCLUIDA' ? 'COMPLETED' : 'IN_PROGRESS',
              },
            }
          : previous,
      );
      setReceipt({ approved, reason: approved ? '' : reason.trim() });
      setConfirming(false);
    } catch (failure) {
      setActionError(
        getApiErrorMessage(
          failure,
          'Não foi possível confirmar a revisão. Atualize a inspeção antes de tentar novamente.',
        ),
      );
      setConfirming(false);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const sections = new Map<string, SnapshotItem[]>();
  detail?.snapshot.forEach((item) => {
    const title = item.secaoTitulo || 'Checklist';
    sections.set(title, [...(sections.get(title) ?? []), item]);
  });
  const orphanEvidence =
    detail?.evidence.filter(
      (photo) => !detail.snapshot.some((item) => item.id === photo.snapshotItemId),
    ) ?? [];

  return (
    <>
      <TopHeader title="Detalhes da inspeção" />
      <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/inspections" className="text-sm text-teal-800 underline">
              Voltar às inspeções
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Inspeção #{id}</h1>
          </div>
          <button
            type="button"
            onClick={reload}
            disabled={loading || saving}
            className="rounded-lg border bg-white px-4 py-2 disabled:opacity-50"
          >
            Atualizar dados
          </button>
        </header>
        {loading && <p role="status">Carregando inspeção e resultados…</p>}
        {error && (
          <div role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">
            {error}{' '}
            <button type="button" onClick={reload} className="underline">
              Tentar novamente
            </button>
          </div>
        )}
        {!loading && detail && inspection && (
          <>
            <section aria-label="Resumo da inspeção" className="rounded-xl border bg-white p-5">
              <h2 className="break-words text-xl font-bold">{inspection.title}</h2>
              <p className="mt-2 font-semibold text-teal-800">
                {inspectionStatusLabels[inspection.status]}
              </p>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ['Cliente', inspection.clientName],
                  ['Local', inspection.siteName],
                  ['Equipamento', inspection.equipmentName],
                  ['Técnico responsável', inspection.technicianName],
                  ['Data agendada', dateLabel(inspection.scheduledDate)],
                  ['Conclusão da execução', dateLabel(inspection.completedAt)],
                  ['Prazo', dateLabel(inspection.dueDate)],
                  [
                    'Modelo utilizado',
                    inspection.templateId
                      ? `#${inspection.templateId} · versão ${inspection.templateVersion ?? 'não informada'}`
                      : undefined,
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-slate-600">{label}</dt>
                    <dd className="break-words font-medium">{value || 'Não informado'}</dd>
                  </div>
                ))}
              </dl>
              {inspection.instructions && (
                <p className="mt-4 whitespace-pre-wrap break-words text-sm">
                  <strong>Instruções: </strong>
                  {inspection.instructions}
                </p>
              )}
              {inspection.observations && (
                <p className="mt-4 whitespace-pre-wrap break-words text-sm">
                  <strong>Observações: </strong>
                  {inspection.observations}
                </p>
              )}
            </section>
            {detail.failures.length > 0 && (
              <div role="alert" className="rounded-lg bg-amber-50 p-4 text-amber-900">
                <p className="font-semibold">
                  A consulta está incompleta. A revisão fica bloqueada até carregar todos os
                  resultados.
                </p>
                <ul className="mt-2 list-inside list-disc">
                  {detail.failures.map((failure, index) => (
                    <li key={index}>{failure}</li>
                  ))}
                </ul>
                <button onClick={reload} className="mt-2 underline">
                  Tentar novamente
                </button>
              </div>
            )}
            <section aria-labelledby="checklist-title" className="space-y-4">
              <h2 id="checklist-title" className="text-xl font-bold">
                Checklist e respostas
              </h2>
              <p className="text-sm text-slate-600">
                Estrutura preservada no agendamento da inspeção.
              </p>
              {!detail.snapshot.length && !detail.failures.length && (
                <p className="rounded-lg border bg-white p-4">
                  Nenhum item de checklist foi retornado. A revisão está bloqueada.
                </p>
              )}
              {Array.from(sections, ([title, items]) => (
                <section
                  key={title}
                  aria-label={title}
                  className="overflow-hidden rounded-xl border bg-white"
                >
                  <h3 className="border-b bg-slate-50 p-4 font-bold">{title}</h3>
                  <ul className="divide-y">
                    {items.map((item) => {
                      const answer = detail.answers.find(
                        (entry) => entry.snapshotItemId === item.id,
                      );
                      const photos = detail.evidence.filter(
                        (photo) => photo.snapshotItemId === item.id,
                      );
                      return (
                        <li key={item.id} className="space-y-2 p-4">
                          <h4 className="break-words font-semibold">{item.itemDescricao}</h4>
                          <p className="text-xs text-slate-600">
                            {item.obrigatorio ? 'Resposta obrigatória' : 'Resposta opcional'}
                            {item.critico ? ' · Item crítico' : ''}
                            {item.evidenciaObrigatoria ? ' · Evidência obrigatória' : ''}
                          </p>
                          <p className="whitespace-pre-wrap break-words">
                            <strong>Resposta: </strong>
                            {detail.failures.length
                              ? answer
                                ? answerLabel(answer, item.tipoResposta)
                                : 'Não disponível nesta consulta'
                              : answerLabel(answer, item.tipoResposta)}
                          </p>
                          {answer?.observacao && (
                            <p className="whitespace-pre-wrap break-words text-sm">
                              <strong>Observação: </strong>
                              {answer.observacao}
                            </p>
                          )}
                          {!!photos.length && <EvidenceList evidence={photos} />}
                          {!photos.length &&
                            item.evidenciaObrigatoria &&
                            !detail.failures.length && (
                              <p className="text-sm text-amber-800">
                                Nenhuma evidência vinculada a este item.
                              </p>
                            )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </section>
            <section aria-label="Evidências da inspeção" className="rounded-xl border bg-white p-5">
              <h2 className="text-lg font-bold">Evidências</h2>
              <p className="mt-2 text-sm text-slate-600">
                {detail.evidence.length} registro(s) retornado(s). A visualização das imagens ainda
                não está disponível; os dados exibidos identificam os arquivos enviados.
              </p>
              {!!orphanEvidence.length && (
                <>
                  <h3 className="mt-4 font-semibold">Arquivos sem vínculo com os itens exibidos</h3>
                  <EvidenceList evidence={orphanEvidence} />
                </>
              )}
            </section>
            <section aria-labelledby="review-title" className="rounded-xl border bg-white p-5">
              <h2 id="review-title" className="text-xl font-bold">
                Revisão do supervisor
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                O estado “Concluída” informa o encerramento da execução. O histórico de decisões e
                os motivos de correção ainda não estão disponíveis para consulta.
              </p>
              {receipt && (
                <div role="status" className="mt-4 rounded-lg bg-teal-50 p-4 text-teal-900">
                  <p className="font-semibold">
                    {receipt.approved
                      ? 'Aprovação confirmada nesta sessão.'
                      : 'Reprovação confirmada. Inspeção devolvida para correção.'}
                  </p>
                  {receipt.reason && <p className="mt-2 break-words">Motivo: {receipt.reason}</p>}
                  <p className="mt-2 text-sm">
                    Esta confirmação fica visível enquanto esta página permanecer aberta.
                  </p>
                </div>
              )}
              {!canReview && (
                <p className="mt-4 text-sm">
                  Entre com um perfil de supervisor para registrar uma decisão.
                </p>
              )}
              {canReview && inspection.status !== 'COMPLETED' && !receipt && (
                <p className="mt-4 text-sm">
                  A revisão estará disponível após o técnico concluir a execução.
                </p>
              )}
              {canSubmit && (
                <form onSubmit={prepareDecision} className="mt-4 space-y-4">
                  <fieldset disabled={saving || confirming} className="space-y-3">
                    <legend className="font-semibold">Decisão</legend>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="decision"
                        checked={decision === 'approve'}
                        onChange={() => setDecision('approve')}
                      />
                      Aprovar inspeção
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="decision"
                        checked={decision === 'reject'}
                        onChange={() => setDecision('reject')}
                      />
                      Reprovar e solicitar correção
                    </label>
                    {decision === 'reject' && (
                      <label className="block text-sm font-semibold">
                        Motivo da reprovação
                        <textarea
                          required
                          maxLength={255}
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          className="mt-2 block w-full rounded-lg border border-slate-400 p-3"
                          rows={4}
                        />
                        <span className="font-normal text-slate-600">
                          {reason.length}/255 caracteres
                        </span>
                      </label>
                    )}
                  </fieldset>
                  {missingRequired && decision === 'approve' && (
                    <p role="alert" className="text-amber-900">
                      Há respostas ou evidências obrigatórias ausentes. A aprovação está bloqueada;
                      solicite a correção.
                    </p>
                  )}
                  {!confirming && (
                    <button
                      type="submit"
                      disabled={saving || (decision === 'approve' && missingRequired)}
                      className="rounded-lg bg-teal-800 px-4 py-2 font-semibold text-white disabled:opacity-50"
                    >
                      Revisar decisão
                    </button>
                  )}
                  {confirming && (
                    <div
                      ref={confirmationRef}
                      tabIndex={-1}
                      role="group"
                      aria-label="Confirmar decisão"
                      className="space-y-3 rounded-lg border border-teal-700 p-4"
                    >
                      <p>
                        {decision === 'approve'
                          ? 'Confirma a aprovação desta inspeção?'
                          : 'Confirma a devolução desta inspeção ao técnico para correção?'}
                      </p>
                      {decision === 'reject' && (
                        <p className="break-words text-sm">{reason.trim()}</p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => setConfirming(false)}
                          className="rounded-lg border px-4 py-2"
                        >
                          Voltar à decisão
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void submitDecision()}
                          className="rounded-lg bg-teal-800 px-4 py-2 text-white disabled:opacity-50"
                        >
                          {saving ? 'Enviando decisão…' : 'Confirmar decisão'}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
              {actionError && (
                <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-800">
                  {actionError}
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
