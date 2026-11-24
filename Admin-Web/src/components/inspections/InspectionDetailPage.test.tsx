import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InspectionDetailPage from './InspectionDetailPage';
import { inspecaoService } from '@/lib/api/services/inspecaoService';
import { revisaoService } from '@/lib/api/services/revisaoService';
import { useSessionStore } from '@/stores/sessionStore';

jest.mock('@/components/layout/TopHeader', () => ({ __esModule: true, default: () => null }));
jest.mock('@/lib/api/services/inspecaoService', () => ({
  inspecaoService: { buscarPorId: jest.fn() },
}));
jest.mock('@/lib/api/services/revisaoService', () => ({
  revisaoService: {
    snapshot: jest.fn(),
    respostas: jest.fn(),
    evidencias: jest.fn(),
    revisar: jest.fn(),
  },
}));

const inspection = {
  id: 42,
  title: 'Compressor',
  status: 'COMPLETED' as const,
  templateId: 9,
  templateVersion: 2,
};
const item = {
  id: 70,
  secaoTitulo: 'Motor',
  itemOriginalId: 12,
  itemDescricao: 'Pressão adequada?',
  tipoResposta: 'CONFORMITY',
  ordem: 1,
  obrigatorio: true,
  critico: true,
  evidenciaObrigatoria: false,
};

beforeEach(() => {
  jest.resetAllMocks();
  useSessionStore.setState({
    session: {
      userId: '8',
      name: 'Supervisora',
      email: 'supervisora@example.test',
      profile: 'SUPERVISOR',
    },
    isInitialized: true,
  });
  jest.mocked(inspecaoService.buscarPorId).mockResolvedValue(inspection);
  jest.mocked(revisaoService.snapshot).mockResolvedValue([item]);
  jest
    .mocked(revisaoService.respostas)
    .mockResolvedValue([
      {
        id: 1,
        inspecaoId: 42,
        snapshotItemId: 70,
        valor: 'false',
        observacao: 'Vazamento identificado',
      },
    ]);
  jest.mocked(revisaoService.evidencias).mockResolvedValue([]);
  jest.mocked(revisaoService.revisar).mockResolvedValue({ id: 42, status: 'CONCLUIDA' } as never);
});

async function prepareRejection(reason = 'Corrigir vazamento e reenviar') {
  fireEvent.click(await screen.findByLabelText('Reprovar e solicitar correção'));
  fireEvent.change(screen.getByLabelText(/Motivo da reprovação/), { target: { value: reason } });
  fireEvent.click(screen.getByRole('button', { name: 'Revisar decisão' }));
}

it('exibe o snapshot, respostas e metadados sem confundir conclusão com aprovação', async () => {
  jest
    .mocked(revisaoService.evidencias)
    .mockResolvedValue([
      {
        id: 3,
        inspecaoId: 42,
        snapshotItemId: 70,
        nomeArquivo: 'evidencia.jpg',
        tipoConteudo: 'image/jpeg',
        dataUpload: '2026-11-20T12:00:00',
      },
    ]);
  render(<InspectionDetailPage id={42} />);
  expect(await screen.findByText('Pressão adequada?')).toBeInTheDocument();
  expect(screen.getByText('Não conforme')).toBeInTheDocument();
  expect(screen.getByText('Vazamento identificado')).toBeInTheDocument();
  expect(screen.getByText('evidencia.jpg')).toBeInTheDocument();
  expect(screen.queryByText('Aprovação confirmada nesta sessão.')).not.toBeInTheDocument();
  expect(screen.getByText(/versão 2/)).toBeInTheDocument();
});

it('exige confirmação explícita e usa o supervisor autenticado', async () => {
  render(<InspectionDetailPage id={42} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Revisar decisão' }));
  expect(revisaoService.revisar).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar decisão' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Aprovação confirmada nesta sessão.');
  expect(revisaoService.revisar).toHaveBeenCalledWith(42, {
    supervisorId: 8,
    aprovado: true,
    motivoReprovacao: '',
  });
  expect(screen.queryByRole('button', { name: 'Revisar decisão' })).not.toBeInTheDocument();
});

it('devolve a inspeção para correção somente após resposta de sucesso', async () => {
  jest
    .mocked(revisaoService.revisar)
    .mockResolvedValue({ id: 42, status: 'EM_ANDAMENTO' } as never);
  render(<InspectionDetailPage id={42} />);
  await prepareRejection();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar decisão' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Inspeção devolvida para correção');
  expect(screen.getByText('Em andamento')).toBeInTheDocument();
  expect(revisaoService.revisar).toHaveBeenCalledWith(42, {
    supervisorId: 8,
    aprovado: false,
    motivoReprovacao: 'Corrigir vazamento e reenviar',
  });
});

it('preserva a justificativa e não exibe sucesso se a API rejeitar a decisão', async () => {
  jest
    .mocked(revisaoService.revisar)
    .mockRejectedValue(new Error('O usuário informado não possui perfil de Supervisor.'));
  render(<InspectionDetailPage id={42} />);
  await prepareRejection();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar decisão' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('não possui perfil');
  expect(screen.getByLabelText(/Motivo da reprovação/)).toHaveValue(
    'Corrigir vazamento e reenviar',
  );
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('bloqueia revisão com consulta incompleta e permite recarregar sem esconder a falha', async () => {
  jest.mocked(revisaoService.respostas).mockRejectedValueOnce(new Error('Acesso negado'));
  render(<InspectionDetailPage id={42} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Acesso negado');
  expect(screen.queryByRole('button', { name: 'Revisar decisão' })).not.toBeInTheDocument();
  expect(screen.queryByText('Sem resposta')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(await screen.findByRole('button', { name: 'Revisar decisão' })).toBeEnabled();
});

it('explica quando a versão da API não possui as rotas de revisão', async () => {
  jest.mocked(revisaoService.snapshot).mockRejectedValue(new Error('No static resource api/v1/inspecoes/42/snapshot.'));
  jest.mocked(revisaoService.respostas).mockRejectedValue(new Error('No static resource api/v1/inspecoes/42/respostas.'));
  render(<InspectionDetailPage id={42} />);

  expect(await screen.findByText(/A revisão fica indisponível até a atualização da API/)).toBeInTheDocument();
  expect(screen.queryByText(/No static resource/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Revisar decisão' })).not.toBeInTheDocument();
});

it('permite ao administrador revisar com o identificador da própria sessão', async () => {
  useSessionStore.setState({
    session: { userId: '1', name: 'Admin', email: 'admin@example.test', profile: 'ADMINISTRADOR' },
  });
  render(<InspectionDetailPage id={42} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Revisar decisão' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar decisão' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Aprovação confirmada nesta sessão.');
  expect(revisaoService.revisar).toHaveBeenCalledWith(42, {
    supervisorId: 1,
    aprovado: true,
    motivoReprovacao: '',
  });
});

it('bloqueia aprovação sem evidência obrigatória, mas permite solicitar correção', async () => {
  jest.mocked(revisaoService.snapshot).mockResolvedValue([{ ...item, evidenciaObrigatoria: true }]);
  render(<InspectionDetailPage id={42} />);
  expect(await screen.findByRole('button', { name: 'Revisar decisão' })).toBeDisabled();
  await prepareRejection();
  expect(screen.getByRole('button', { name: 'Confirmar decisão' })).toBeEnabled();
});

it('não envia decisão se o estado mudar durante a análise', async () => {
  jest
    .mocked(inspecaoService.buscarPorId)
    .mockResolvedValueOnce(inspection)
    .mockResolvedValue({ ...inspection, status: 'IN_PROGRESS' });
  render(<InspectionDetailPage id={42} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Revisar decisão' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar decisão' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('mudou de estado');
  expect(revisaoService.revisar).not.toHaveBeenCalled();
});

it('bloqueia duplo envio enquanto a decisão está em andamento', async () => {
  let resolve!: (value: never) => void;
  jest.mocked(revisaoService.revisar).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  render(<InspectionDetailPage id={42} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Revisar decisão' }));
  const button = screen.getByRole('button', { name: 'Confirmar decisão' });
  fireEvent.click(button);
  fireEvent.click(button);
  await waitFor(() => expect(revisaoService.revisar).toHaveBeenCalledTimes(1));
  expect(screen.getByRole('button', { name: 'Enviando decisão…' })).toBeDisabled();
  resolve({ id: 42, status: 'CONCLUIDA' } as never);
  expect(await screen.findByRole('status')).toHaveTextContent('Aprovação confirmada');
});
