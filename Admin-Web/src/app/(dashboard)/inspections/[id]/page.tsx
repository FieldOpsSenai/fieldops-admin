import { notFound } from 'next/navigation';
import InspectionDetailPage from '@/components/inspections/InspectionDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inspectionId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(inspectionId) || inspectionId <= 0) notFound();
  return <InspectionDetailPage key={inspectionId} id={inspectionId} />;
}
