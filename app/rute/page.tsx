import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { StorageAdapter } from '@/lib/storage/adapter';
import { RouteMap, StageDataSummary } from '@/components/route/RouteMap';
import { AppHeader } from '@/components/ui/AppHeader';
import { STAGE_ORDER, STAGE_DEFINITIONS, getStageStatus, isStageUnlocked } from '@/lib/route/stages';
import { evaluateStageRequirements } from '@/lib/route/requirements';
import { getMemberAccessLevel } from '@/lib/access/guard';

export const dynamic = 'force-dynamic';

export default async function RutePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Ensure user has a workspace
  let workspaceId = user.workspaceId;
  if (!workspaceId) {
    const newWs = await StorageAdapter.createWorkspace(user.id, user.name);
    workspaceId = newWs.id;
    await StorageAdapter.updateUserAccount(user.id, { workspaceId: newWs.id });
  }

  const workspace = await StorageAdapter.getWorkspace(workspaceId);
  if (!workspace) {
    // If somehow missing, recreate
    const newWs = await StorageAdapter.createWorkspace(user.id, user.name);
    workspaceId = newWs.id;
    await StorageAdapter.updateUserAccount(user.id, { workspaceId: newWs.id });
  }

  const currentWorkspace = (await StorageAdapter.getWorkspace(workspaceId))!;
  const userAccess = getMemberAccessLevel(currentWorkspace, user.id) || 'read';

  // Get Route state
  const route = await StorageAdapter.getWorkspaceRoute(workspaceId);

  // Get Settings, Profile, Khitbah
  const settings = (await StorageAdapter.getModule(workspaceId, 'settings')) as any;
  const profile = (await StorageAdapter.getModule(workspaceId, 'profile')) as any;
  const khitbah = (await StorageAdapter.getModule(workspaceId, 'khitbah')) as any;

  const partnerName = profile?.partner?.fullName || profile?.partner?.nickname || '';
  const targetDate = settings?.targetDate || khitbah?.execution?.weddingTargetDate || '';

  // Evaluate requirements for each stage
  const stages: StageDataSummary[] = await Promise.all(
    STAGE_ORDER.map(async (key) => {
      const def = STAGE_DEFINITIONS[key];
      const status = getStageStatus(route, key);
      const unlocked = isStageUnlocked(route, key);

      let reqEval = null;
      if (unlocked) {
        reqEval = await evaluateStageRequirements(workspaceId, key);
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
        requirements: reqEval,
      };
    })
  );

  const roleLabels: Record<string, string> = {
    owner: 'Pemilik',
    full: 'Full Akses',
    read: 'Hanya Baca',
  };

  return (
    <div className="min-h-screen bg-white">
      <AppHeader
        title="Road To Halal"
        subtitle={partnerName ? `Bersama ${partnerName}` : 'Peta Perjalanan Pranikah'}
        userRoleBadge={roleLabels[userAccess]}
        isReadOnly={userAccess === 'read'}
      />
      <RouteMap
        currentStage={route.currentStage}
        routeStatus={route.status}
        stages={stages}
        targetDate={targetDate}
        partnerName={partnerName}
        userAccess={userAccess}
      />
    </div>
  );
}
