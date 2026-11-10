import { STAGE_ORDER } from '@/lib/schemas/workspace';
import StageClientPage from './StageClientPage';

export function generateStaticParams() {
  return STAGE_ORDER.map((stage) => ({ stage }));
}

export default function Page({ params }: { params: { stage: string } }) {
  return <StageClientPage stage={params.stage} />;
}
