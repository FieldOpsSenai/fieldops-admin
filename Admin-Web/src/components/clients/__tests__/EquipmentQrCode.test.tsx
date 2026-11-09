import { render, screen } from '@testing-library/react';
import QRCode from 'qrcode';
import EquipmentQrCode from '../EquipmentQrCode';

jest.mock('qrcode', () => ({ __esModule: true, default: { toString: jest.fn() } }));
beforeEach(() => jest.clearAllMocks());

it('renderiza e disponibiliza o QR recebido da API sem trocar o identificador', async () => {
  (QRCode.toString as jest.Mock).mockResolvedValue('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  render(<EquipmentQrCode value="QR-persistido-42" name="Compressor" />);
  const image = await screen.findByAltText('QR Code de Compressor');
  expect(QRCode.toString).toHaveBeenCalledWith('QR-persistido-42', expect.objectContaining({ type: 'svg' }));
  expect(image).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml'));
  expect(screen.getByRole('link', { name: 'Baixar QR Code' })).toHaveAttribute('download', 'fieldops-equipamento-QR-persistido-42.svg');
});

it('não inventa um QR quando a API não fornece identificador', () => {
  render(<EquipmentQrCode name="Sem código" />);
  expect(screen.getByText(/ainda não possui QR Code/)).toBeInTheDocument();
  expect(QRCode.toString).not.toHaveBeenCalled();
});
