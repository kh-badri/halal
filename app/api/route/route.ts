import { NextResponse } from 'next/server';
import { guardApiAccess } from '@/lib/access/guard';
import { STAGE_ORDER, STAGE_DEFINITIONS, getStageStatus, isStageUnlocked } from '@/lib/route/stages';
import { evaluateStageRequirements } from '@/lib/route/requirements';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await guardApiAccess({});
  if (!guard.ok) {
    return guard.response;
  }

  const { workspace, route, access } = guard;

  // Evaluate each stage status and requirement progress
  const stageList = await Promise.all(
    STAGE_ORDER.map(async (key) => {
      const def = STAGE_DEFINITIONS[key];
      const status = getStageStatus(route, key);
      const unlocked = isStageUnlocked(route, key);

      // Only calculate requirements if stage is unlocked or active
      let requirements = null;
      if (unlocked) {
        requirements = await evaluateStageRequirements(workspace.id, key);
      }

      return {
        key,
        stepNumber: def.stepNumber,
        title: def.title,
        shortTitle: def.shortTitle,
        subtitle: def.subtitle,
        path: def.path,
        status,
        isUnlocked: unlocked,
        requirements,
      };
    })
  );

  return NextResponse.json({
    workspaceId: workspace.id,
    currentStage: route.currentStage,
    status: route.status,
    completed: route.completed || {},
    access,
    stages: stageList,
  });
}
