import { StageKey } from '../schemas/workspace';
import { StorageAdapter } from '../storage/adapter';

export interface RequirementItem {
  id: string;
  label: string;
  isMet: boolean;
  hint?: string;
}

export interface StageRequirementEvaluation {
  stageKey: StageKey;
  canComplete: boolean;
  totalRequirements: number;
  metRequirements: number;
  items: RequirementItem[];
}

/**
 * Evaluates completion requirements for a given stage on the server.
 * Returns an itemized list of requirements and whether the stage can be completed.
 */
export async function evaluateStageRequirements(
  workspaceId: string,
  stageKey: StageKey
): Promise<StageRequirementEvaluation> {
  const items: RequirementItem[] = [];

  switch (stageKey) {
    case 'persetujuan-taaruf': {
      const taaruf = (await StorageAdapter.getModule(workspaceId, 'taaruf')) as any;
      const profile = (await StorageAdapter.getModule(workspaceId, 'profile')) as any;

      const self = profile?.self || {};
      const partner = profile?.partner || {};

      // 1. Biodata Saya
      const selfComplete = Boolean(
        (self.fullName || self.name) &&
        (self.birthDate || self.dob) &&
        self.domicile &&
        self.occupation &&
        (self.phone || self.whatsapp)
      );
      items.push({
        id: 'req_self_biodata',
        label: 'Field wajib biodata Saya terisi (nama, tgl lahir, domisili, pekerjaan, kontak)',
        isMet: selfComplete,
      });

      // 2. Biodata Calon
      const partnerComplete = Boolean(
        (partner.fullName || partner.name) &&
        (partner.birthDate || partner.dob) &&
        partner.domicile &&
        partner.occupation &&
        (partner.phone || partner.whatsapp)
      );
      items.push({
        id: 'req_partner_biodata',
        label: 'Field wajib biodata Calon terisi (nama, tgl lahir, domisili, pekerjaan, kontak)',
        isMet: partnerComplete,
      });

      // 3. Perantara terisi
      const mediatorComplete = Boolean(
        taaruf?.mediator?.name && taaruf?.mediator?.phone
      );
      items.push({
        id: 'req_mediator',
        label: 'Data perantara (nama & kontak) terisi',
        isMet: mediatorComplete,
      });

      // 4. Checklist Nadzor & Istikharah
      const nadzorOk = Boolean(taaruf?.nadzor?.checked);
      const istikharahOk = Boolean(taaruf?.istikharah?.checked);
      items.push({
        id: 'req_nadzor_istikharah',
        label: 'Checklist Nadzor dan Istikharah tercentang',
        isMet: nadzorOk && istikharahOk,
      });

      // 5. Riwayat kesehatan & keluarga sudah saling ditukar
      const healthExchanged = Boolean(taaruf?.healthExchanged);
      const familyExchanged = Boolean(taaruf?.familyExchanged);
      items.push({
        id: 'req_exchanged',
        label: 'Penanda riwayat kesehatan & keluarga sudah saling ditukar tercentang',
        isMet: healthExchanged && familyExchanged,
      });

      // 6. Keputusan Saya dan Calon sama-sama "Setuju lanjut ta'aruf"
      const selfDecision = taaruf?.decisions?.selfDecision;
      const partnerDecision = taaruf?.decisions?.partnerDecision;
      items.push({
        id: 'req_decisions',
        label: 'Keputusan Saya dan Calon sama-sama "Setuju lanjut ta’aruf"',
        isMet: selfDecision === 'setuju' && partnerDecision === 'setuju',
      });

      break;
    }

    case 'proses-taaruf': {
      const taaruf = (await StorageAdapter.getModule(workspaceId, 'taaruf')) as any;
      const cards: any[] = (taaruf?.qaCards || []).filter((c: any) => !c.deletedAt);

      const hasBelum = cards.some((c) => c.status === 'belum');
      const hasUlang = cards.some((c) => c.status === 'ulang');
      const principleCards = cards.filter((c) => c.principle);
      const allPrincipleSepakat = principleCards.length > 0
        ? principleCards.every((c) => c.status === 'sepakat')
        : true;

      items.push({
        id: 'req_no_belum',
        label: 'Tidak ada pertanyaan berstatus "Belum dibahas"',
        isMet: cards.length > 0 && !hasBelum,
      });

      items.push({
        id: 'req_no_ulang',
        label: 'Tidak ada pertanyaan berstatus "Perlu dibahas lagi"',
        isMet: cards.length > 0 && !hasUlang,
      });

      items.push({
        id: 'req_principles_agreed',
        label: 'Semua pertanyaan bertanda Prinsip berstatus "Sepakat"',
        isMet: allPrincipleSepakat,
      });

      break;
    }

    case 'kesepakatan-khitbah': {
      const khitbah = (await StorageAdapter.getModule(workspaceId, 'khitbah')) as any;

      items.push({
        id: 'req_summary_reviewed',
        label: 'Ringkasan kesepakatan sudah ditinjau',
        isMet: Boolean(khitbah?.summaryReviewed),
      });

      const familyAgreed = Boolean(
        khitbah?.familyConsent?.selfFamilyAgreed &&
        khitbah?.familyConsent?.partnerFamilyAgreed
      );
      items.push({
        id: 'req_family_consent',
        label: 'Restu keluarga kedua belah pihak tercentang',
        isMet: familyAgreed,
      });

      const eventInfoFilled = Boolean(
        khitbah?.eventDate &&
        khitbah?.eventStartTime &&
        (khitbah?.locationName || khitbah?.locationAddress)
      );
      items.push({
        id: 'req_event_info',
        label: 'Tanggal, jam, dan lokasi khitbah terisi',
        isMet: eventInfoFilled,
      });

      const decisionsOk = Boolean(
        khitbah?.decisions?.selfDecision === 'lanjut' &&
        khitbah?.decisions?.partnerDecision === 'lanjut'
      );
      items.push({
        id: 'req_khitbah_decision',
        label: 'Keputusan Saya dan Calon sama-sama "Lanjut khitbah"',
        isMet: decisionsOk,
      });

      break;
    }

    case 'proses-khitbah': {
      const khitbah = (await StorageAdapter.getModule(workspaceId, 'khitbah')) as any;
      const settings = (await StorageAdapter.getModule(workspaceId, 'settings')) as any;

      const gifts: any[] = (khitbah?.gifts || []).filter((g: any) => !g.deletedAt);
      const allGiftsPacked = gifts.length > 0 && gifts.every((g) => g.status === 'dikemas');

      items.push({
        id: 'req_gifts_packed',
        label: 'Semua kotak seserahan berstatus "Sudah Dikemas"',
        isMet: allGiftsPacked,
      });

      const prep: any[] = (khitbah?.prepChecklist || []).filter((p: any) => !p.deletedAt);
      const prepCompleted = prep.length > 0 && prep.every((p) => p.completed);
      items.push({
        id: 'req_prep_checklist',
        label: 'Semua checklist persiapan hari khitbah selesai',
        isMet: prepCompleted,
      });

      const khitbahDone = Boolean(khitbah?.execution?.completed && khitbah?.execution?.executionDate);
      items.push({
        id: 'req_khitbah_done',
        label: 'Khitbah ditandai terlaksana dengan tanggal',
        isMet: khitbahDone,
      });

      const weddingDateSet = Boolean(khitbah?.execution?.weddingTargetDate || settings?.targetDate);
      items.push({
        id: 'req_wedding_date',
        label: 'Tanggal akad ditetapkan',
        isMet: weddingDateSet,
      });

      break;
    }

    case 'kesepakatan-akad': {
      const budget = (await StorageAdapter.getModule(workspaceId, 'budget')) as any;

      items.push({
        id: 'req_akad_date',
        label: 'Tanggal akad terisi',
        isMet: Boolean(budget?.agreement?.akadDate),
      });

      const maharFilled = Boolean(budget?.mahar?.description || (budget?.mahar?.value && budget.mahar.value > 0));
      items.push({
        id: 'req_mahar',
        label: 'Mahar terisi (bentuk dan nominal/deskripsi)',
        isMet: maharFilled,
      });

      const maharPos = (budget?.categories || []).find((c: any) => c.id === 'mahar');
      const akadPos = (budget?.categories || []).find((c: any) => c.id === 'akad_walimah');
      const posTargetsOk = Boolean((maharPos?.targetBudget || 0) > 0 && (akadPos?.targetBudget || 0) > 0);
      items.push({
        id: 'req_budget_targets',
        label: 'Target pos Mahar dan Biaya Akad/Walimah terisi',
        isMet: posTargetsOk,
      });

      const funds: any[] = (budget?.fundingSources || []).filter((f: any) => !f.deletedAt);
      items.push({
        id: 'req_funding_sources',
        label: 'Minimal satu sumber dana dicatat',
        isMet: funds.length > 0,
      });

      items.push({
        id: 'req_wali_nasab',
        label: 'Nama wali nasab terisi',
        isMet: Boolean(budget?.agreement?.waliNasab),
      });

      items.push({
        id: 'req_family_budget_consent',
        label: 'Persetujuan kedua keluarga atas tanggal dan anggaran tercentang',
        isMet: Boolean(budget?.agreement?.familyConsent),
      });

      break;
    }

    case 'administrasi-kua': {
      const kua = (await StorageAdapter.getModule(workspaceId, 'kua')) as any;

      const docs: any[] = (kua?.documents || []).filter((d: any) => !d.deletedAt);
      const docsOk = docs.length > 0 && docs.every((d) => d.status === 'selesai' || d.status === 'tidak_berlaku');
      items.push({
        id: 'req_kua_docs',
        label: 'Semua berkas Catin Pria & Wanita berstatus "Selesai" atau "Tidak berlaku"',
        isMet: docsOk,
      });

      if (kua?.recommendationLetter?.isRequired) {
        items.push({
          id: 'req_recom_letter',
          label: 'Surat rekomendasi nikah berstatus "Diserahkan ke KUA tujuan"',
          isMet: kua.recommendationLetter.status === 'diserahkan',
        });
      }

      items.push({
        id: 'req_kua_registered',
        label: 'Pendaftaran nikah ke KUA ditandai terdaftar dengan tanggal',
        isMet: Boolean(kua?.registeredDate),
      });

      const ttOk = (kua?.ttInjections || []).every((tt: any) => tt.status === 'selesai' || tt.status === 'tidak_berlaku');
      const hcOk = (kua?.healthCheckups || []).every((hc: any) => hc.status === 'selesai' || hc.status === 'tidak_berlaku');
      items.push({
        id: 'req_health_kua',
        label: 'Suntik TT dan cek kesehatan pranikah selesai',
        isMet: Boolean(ttOk && hcOk),
      });

      const bimwinOk = kua?.bimwin?.status === 'selesai' && Boolean(kua?.bimwin?.certificateNumber || kua?.bimwin?.notes);
      items.push({
        id: 'req_bimwin',
        label: 'Bimwin selesai dengan nomor atau bukti sertifikat',
        isMet: Boolean(bimwinOk),
      });

      break;
    }

    case 'persiapan-walimah': {
      const budget = (await StorageAdapter.getModule(workspaceId, 'budget')) as any;
      const harih = (await StorageAdapter.getModule(workspaceId, 'harih')) as any;

      const vendors: any[] = (budget?.vendors || []).filter((v: any) => !v.deletedAt);
      const vendorsOk = vendors.length > 0 && vendors.every((v) => {
        const totalPaid = (v.payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        return totalPaid > 0; // minimal DP
      });
      items.push({
        id: 'req_vendors_dp',
        label: 'Semua vendor terdaftar berstatus minimal DP atau Lunas (tidak terlambat)',
        isMet: vendorsOk,
      });

      const guests: any[] = (harih?.guests || []).filter((g: any) => !g.deletedAt);
      const totalPax = guests.reduce((sum: number, g: any) => sum + (g.pax || 1), 0);
      const maxPax = harih?.catering?.vendorTotalPax || 500;
      items.push({
        id: 'req_catering_quota',
        label: `Total tamu (${totalPax} pax) tidak melebihi kuota katering (${maxPax} pax)`,
        isMet: totalPax <= maxPax && guests.length > 0,
      });

      const committee: any[] = harih?.committee || [];
      const waliMember = committee.find((c) => c.role?.toLowerCase().includes('wali'));
      const saksiMembers = committee.filter((c) => c.role?.toLowerCase().includes('saksi'));
      const committeeOk = Boolean(
        waliMember?.isConfirmed &&
        saksiMembers.length >= 2 &&
        saksiMembers.every((s) => s.isConfirmed)
      );
      items.push({
        id: 'req_wali_saksi_confirmed',
        label: 'Wali nasab dan minimal 2 saksi nikah terkonfirmasi',
        isMet: committeeOk,
      });

      const allGuestsInvited = guests.length > 0 && guests.every((g) => g.status !== 'belum');
      items.push({
        id: 'req_guests_status',
        label: 'Semua tamu berstatus minimal "Diundang"',
        isMet: allGuestsInvited,
      });

      break;
    }

    case 'hari-h': {
      const harih = (await StorageAdapter.getModule(workspaceId, 'harih')) as any;

      const checklist: any[] = harih?.hMin1Checklist || [];
      const checklistOk = checklist.length > 0 && checklist.every((c) => c.status === 'selesai' || c.completed);
      items.push({
        id: 'req_hmin1_checklist',
        label: 'Semua checklist H-1 selesai',
        isMet: checklistOk,
      });

      items.push({
        id: 'req_akad_completed',
        label: 'Akad nikah ditandai terlaksana',
        isMet: Boolean(harih?.akadCompleted && harih?.akadDate),
      });

      break;
    }

    case 'halal': {
      items.push({
        id: 'req_halal',
        label: 'Tujuan tercapai',
        isMet: true,
      });
      break;
    }
  }

  const metCount = items.filter((i) => i.isMet).length;
  const canComplete = items.length > 0 && metCount === items.length;

  return {
    stageKey,
    canComplete,
    totalRequirements: items.length,
    metRequirements: metCount,
    items,
  };
}
