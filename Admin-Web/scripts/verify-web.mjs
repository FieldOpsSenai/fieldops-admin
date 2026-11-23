// Teste de navegador com contratos controlados: não escreve na API da equipe.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const require = createRequire(import.meta.url);
const probe = createServer();
await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  [
    require.resolve('next/dist/bin/next'),
    'start',
    '--hostname',
    '127.0.0.1',
    '--port',
    String(port),
  ],
  {
    windowsHide: true,
    env: {
      ...process.env,
      FIELDOPS_API_INTERNAL_URL: 'http://127.0.0.1:9/api/v1',
      NEXT_TELEMETRY_DISABLED: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let serverLog = '';
server.stdout.on('data', (chunk) => {
  serverLog += chunk;
});
server.stderr.on('data', (chunk) => {
  serverLog += chunk;
});
let browser;
const results = [];

try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(serverLog);
    try {
      ready = (await fetch(`${origin}/login`, { signal: AbortSignal.timeout(1000) })).ok;
    } catch {
      /* aguardando servidor */
    }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  assert.ok(ready, `Servidor não iniciou: ${serverLog}`);
  // Chrome instalado pode ser usado sem baixar outro navegador; contexto efêmero.
  browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {},
  );
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(`${origin}/inspections/42`);
  await page.waitForURL('**/login?redirect=*');
  results.push('Rota protegida redireciona visitante ao login.');

  await context.addCookies([
    {
      name: 'fieldops_access',
      value: 'browser-test-only',
      url: origin,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  let profile = 'SUPERVISOR';
  let failAnswers = false;
  let failDecision = false;
  let status = 'CONCLUIDA';
  const decisions = [];
  const unexpected = [];
  const inspection = () => ({
    id: 42,
    descricao: 'Inspeção de demonstração',
    status,
    dataAgendada: '2026-11-20T09:00:00',
    dataRealizacao: '2026-11-20T10:00:00',
    modeloId: 9,
    modeloVersao: 2,
    usuarioId: 4,
    usuarioNome: 'Técnica de demonstração',
    clienteNome: 'Cliente de demonstração',
    localNome: 'Unidade A',
    equipamentoNome: 'Compressor',
    prioridade: 'ALTA',
  });
  await context.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    const json = (body, responseStatus = 200) =>
      route.fulfill({ status: responseStatus, json: body });
    if (path === '/api/session')
      return json({
        session: {
          userId: '8',
          name: 'Pessoa de demonstração',
          email: 'demo@example.test',
          profile,
        },
      });
    if (path === '/api/v1/inspecoes')
      return json({
        content: [inspection()],
        number: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
      });
    if (path === '/api/v1/clientes')
      return json({ content: [], number: 0, size: 100, totalElements: 0, totalPages: 0 });
    if (path === '/api/v1/inspecoes/tecnicos-disponiveis') return json([]);
    if (path === '/api/v1/inspecoes/42/snapshot')
      return json([
        {
          id: 70,
          itemOriginalId: 12,
          secaoTitulo: 'Motor',
          itemDescricao: 'Pressão adequada?',
          tipoResposta: 'CONFORMITY',
          ordem: 1,
          obrigatorio: true,
          critico: true,
          evidenciaObrigatoria: true,
        },
      ]);
    if (path === '/api/v1/inspecoes/42/respostas')
      return failAnswers
        ? json({ message: 'Sem permissão para consultar respostas.' }, 403)
        : json([
            {
              id: 1,
              inspecaoId: 42,
              snapshotItemId: 70,
              valor: 'false',
              observacao: 'Vazamento identificado',
            },
          ]);
    if (path === '/api/v1/inspecoes/42/fotos')
      return json([
        {
          id: 3,
          inspecaoId: 42,
          snapshotItemId: 70,
          nomeArquivo: 'evidencia-demo.jpg',
          tipoConteudo: 'image/jpeg',
          dataUpload: '2026-11-20T10:00:00',
        },
      ]);
    if (path === '/api/v1/inspecoes/42/revisar' && method === 'PATCH') {
      const body = route.request().postDataJSON();
      decisions.push(body);
      if (failDecision) return json({ message: 'Revisão indisponível no backend de teste.' }, 422);
      status = body.aprovado ? 'CONCLUIDA' : 'EM_ANDAMENTO';
      return json(inspection());
    }
    unexpected.push(`${method} ${path}`);
    return json({ message: 'Contrato não previsto no teste.' }, 501);
  });

  await page.goto(`${origin}/inspections`);
  await page.getByRole('link', { name: 'Detalhes / revisão' }).click();
  await page.getByRole('button', { name: 'Revisar decisão' }).waitFor();
  assert.equal(await page.getByText('Vazamento identificado').count(), 1);
  assert.equal(await page.getByText('evidencia-demo.jpg').count(), 1);
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/inspection-desktop.png', fullPage: true });
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  assert.deepEqual(
    accessibility.violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      targets: nodes.map((node) => node.target),
    })),
    [],
    'Violações de acessibilidade na tela de detalhes',
  );
  results.push('Navegação lista → detalhes, respostas, evidências e axe WCAG 2.1 AA.');

  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    'Overflow horizontal no celular',
  );
  await page.screenshot({ path: 'test-results/inspection-mobile.png', fullPage: true });
  await page.getByLabel('Reprovar e solicitar correção').check();
  await page.getByLabel('Motivo da reprovação').fill('Corrigir vazamento e reenviar');
  await page.getByRole('button', { name: 'Revisar decisão' }).click();
  assert.equal(
    await page
      .getByRole('group', { name: 'Confirmar decisão' })
      .evaluate((element) => element === document.activeElement),
    true,
  );
  await page.getByRole('button', { name: 'Confirmar decisão' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('status').filter({ hasText: 'Reprovação confirmada' }).waitFor();
  assert.deepEqual(decisions[0], {
    supervisorId: 8,
    aprovado: false,
    motivoReprovacao: 'Corrigir vazamento e reenviar',
  });
  results.push('Celular sem overflow; confirmação por teclado; reprovação enviada uma vez.');

  status = 'CONCLUIDA';
  failDecision = true;
  await page.reload();
  await page.getByLabel('Reprovar e solicitar correção').check();
  await page.getByLabel('Motivo da reprovação').fill('Justificativa preservada');
  await page.getByRole('button', { name: 'Revisar decisão' }).click();
  await page.getByRole('button', { name: 'Confirmar decisão' }).click();
  await page.getByRole('alert').filter({ hasText: 'Revisão indisponível' }).waitFor();
  assert.equal(
    await page.getByLabel('Motivo da reprovação').inputValue(),
    'Justificativa preservada',
  );
  assert.equal(await page.getByRole('status').count(), 0);
  results.push('Falha de revisão preserva justificativa e não exibe sucesso.');

  failAnswers = true;
  await page.reload();
  await page.getByRole('alert').filter({ hasText: 'consulta está incompleta' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Revisar decisão' }).count(), 0);
  failAnswers = false;
  failDecision = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await page.getByRole('button', { name: 'Revisar decisão' }).click();
  await page.getByRole('button', { name: 'Confirmar decisão' }).click();
  await page.getByRole('status').filter({ hasText: 'Aprovação confirmada' }).waitFor();
  results.push('Consulta incompleta bloqueia revisão; nova tentativa recupera e permite aprovar.');

  profile = 'ADMINISTRADOR';
  await page.reload();
  await page.getByText('Entre com um perfil de supervisor').waitFor();
  assert.equal(await page.getByRole('button', { name: 'Revisar decisão' }).count(), 0);
  assert.deepEqual(unexpected, []);
  assert.deepEqual(pageErrors, []);
  results.push('Permissão visual de revisão; sem erros JavaScript ou endpoints inesperados.');
  await writeFile(
    'test-results/browser-verification.json',
    JSON.stringify(
      { mode: 'Contratos controlados; não é integração com API real.', results },
      null,
      2,
    ),
  );
  console.log(results.join('\n'));
} finally {
  await browser?.close();
  server.kill();
}
