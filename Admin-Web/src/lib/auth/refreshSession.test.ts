import { cancelSessionRefresh, refreshSession } from './refreshSession';

const fetchMock = jest.fn();
beforeEach(() => { cancelSessionRefresh(); fetchMock.mockReset(); global.fetch = fetchMock; });

it('compartilha uma renovação entre requisições concorrentes', async () => {
  let resolve!: (value: { ok: boolean; status: number }) => void;
  fetchMock.mockReturnValue(new Promise((done) => { resolve = done; }));
  const first = refreshSession();
  const second = refreshSession();
  expect(first).toBe(second);
  resolve({ ok: true, status: 200 });
  await expect(first).resolves.toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('diferencia expiração definitiva de falha transitória da API', async () => {
  fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
  await expect(refreshSession()).resolves.toBe(false);
  fetchMock.mockResolvedValueOnce({ ok: false, status: 502 });
  await expect(refreshSession()).rejects.toThrow(/indisponível/);
});
