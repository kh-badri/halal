const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function runTests() {
  console.log('=== STARTING FASE 2 AUTOMATED TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Register a new user & workspace
    const testEmail = `fase2_tester_${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log(`1. Registering user: ${testEmail}`);
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testEmail,
        password,
        name: 'Tester Fase 2',
        role: 'pria',
      }),
    });

    assert(regRes.status === 200 || regRes.status === 201, `Register HTTP status 200/201 (got ${regRes.status})`);
    const regCookie = regRes.headers.get('set-cookie');
    assert(Boolean(regCookie), 'Session cookie received');

    const authHeaders = {
      Cookie: regCookie.split(';')[0],
      'Content-Type': 'application/json',
    };

    function getStageReq(routeJson, stageKey) {
      const st = (routeJson.stages || []).find((s) => s.key === stageKey);
      return st ? st.requirements : null;
    }

    // 2. Verify Route is at persetujuan-taaruf
    const routeRes1 = await fetch(`${BASE_URL}/api/route`, { headers: authHeaders });
    const routeJson1 = await routeRes1.json();
    assert(routeJson1.currentStage === 'persetujuan-taaruf', `Current stage is persetujuan-taaruf (got ${routeJson1.currentStage})`);
    const req1 = getStageReq(routeJson1, 'persetujuan-taaruf');
    assert(req1 && req1.canComplete === false, 'Tahap 1 initially cannot be completed');

    // 3. Complete Tahap 1 Requirements
    // Update profile (biodata)
    const profilePatch = {
      self: {
        fullName: 'Ahmad Tester',
        birthDate: '1998-05-10',
        domicile: 'Jakarta Selatan',
        occupation: 'Software Engineer',
        phone: '081234567890',
      },
      partner: {
        fullName: 'Fatimah Calon',
        birthDate: '2000-08-15',
        domicile: 'Bandung',
        occupation: 'Guru Arsitektur',
        phone: '081298765432',
      },
    };
    const profRes = await fetch(`${BASE_URL}/api/m/profile`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(profilePatch),
    });
    assert(profRes.ok, 'Profile biodata updated successfully');

    // Update taaruf data (mediator, nadzor, istikharah, exchanged, decisions)
    const taarufPatch1 = {
      mediator: { name: 'Ustadz Pembimbing', phone: '08111222333', relation: 'Murabbi' },
      nadzor: { checked: true, date: '2026-11-10', notes: 'Alhamdulillah lancar' },
      istikharah: { checked: true, date: '2026-11-12', notes: 'Hati mantap dan tenang' },
      healthExchanged: true,
      familyExchanged: true,
      decisions: {
        selfDecision: 'setuju',
        selfNotes: 'Bismillah mantap lanjut',
        partnerDecision: 'setuju',
        partnerNotes: 'Bismillah siap berproses',
      },
    };
    const tRes1 = await fetch(`${BASE_URL}/api/m/taaruf`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(taarufPatch1),
    });
    assert(tRes1.ok, 'Taaruf Stage 1 data updated');

    // Check Route evaluation again
    const routeRes2 = await fetch(`${BASE_URL}/api/route`, { headers: authHeaders });
    const routeJson2 = await routeRes2.json();
    const req2 = getStageReq(routeJson2, 'persetujuan-taaruf');
    assert(req2 && req2.canComplete === true, 'Tahap 1 requirements are fully met');

    // Complete Stage 1 -> Advance to Stage 2
    const compRes1 = await fetch(`${BASE_URL}/api/route/complete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ stageKey: 'persetujuan-taaruf' }),
    });
    const compJson1 = await compRes1.json();
    assert(compRes1.ok, 'Stage 1 completed successfully');
    assert(compJson1.nextStage === 'proses-taaruf', `Advanced to proses-taaruf (got ${compJson1.nextStage})`);

    // 4. Tahap 2: 57 Kartu Tanya Jawab
    // Check initial cards count and status
    const tDataRes = await fetch(`${BASE_URL}/api/m/taaruf`, { headers: authHeaders });
    const tDataJson = await tDataRes.json();
    const cards = tDataJson.data.qaCards || [];
    assert(cards.length === 57, `Default QA cards count is 57 (got ${cards.length})`);

    // Initially canComplete is false
    const routeRes3 = await fetch(`${BASE_URL}/api/route`, { headers: authHeaders });
    const routeJson3 = await routeRes3.json();
    assert(routeJson3.currentStage === 'proses-taaruf', 'Current stage is proses-taaruf');
    const req3 = getStageReq(routeJson3, 'proses-taaruf');
    assert(req3 && req3.canComplete === false, 'Tahap 2 initially cannot be completed');

    // Update all cards to "sepakat"
    const updatedCards = cards.map((c) => ({
      ...c,
      status: 'sepakat',
      answerSelf: 'Jawaban saya mantap',
      answerPartner: 'Jawaban calon sepakat',
      note: 'Telah disetujui bersama',
    }));

    const cardPatchRes = await fetch(`${BASE_URL}/api/m/taaruf`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ qaCards: updatedCards }),
    });
    assert(cardPatchRes.ok, 'All 57 QA cards updated to sepakat');

    // Check Stage 2 completion readiness
    const routeRes4 = await fetch(`${BASE_URL}/api/route`, { headers: authHeaders });
    const routeJson4 = await routeRes4.json();
    const req4 = getStageReq(routeJson4, 'proses-taaruf');
    assert(req4 && req4.canComplete === true, 'Tahap 2 requirements now satisfied');

    // Complete Stage 2 -> Advance to Stage 3
    const compRes2 = await fetch(`${BASE_URL}/api/route/complete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ stageKey: 'proses-taaruf' }),
    });
    const compJson2 = await compRes2.json();
    assert(compRes2.ok, 'Stage 2 completed successfully');
    assert(compJson2.nextStage === 'kesepakatan-khitbah', `Advanced to kesepakatan-khitbah (got ${compJson2.nextStage})`);

    // 5. Tahap 3: Kesepakatan Khitbah
    const routeRes5 = await fetch(`${BASE_URL}/api/route`, { headers: authHeaders });
    const routeJson5 = await routeRes5.json();
    assert(routeJson5.currentStage === 'kesepakatan-khitbah', 'Current stage is kesepakatan-khitbah');
    const req5 = getStageReq(routeJson5, 'kesepakatan-khitbah');
    assert(req5 && req5.canComplete === false, 'Tahap 3 initially cannot be completed');

    // Test decision junction: choosing "tidak" halts the route
    await fetch(`${BASE_URL}/api/m/khitbah`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        decisions: { selfDecision: 'tidak', partnerDecision: 'belum' },
      }),
    });
    const haltedRouteRes = await fetch(`${BASE_URL}/api/route`, { headers: authHeaders });
    const haltedJson = await haltedRouteRes.json();
    assert(haltedJson.status === 'berhenti', 'Route halted when decision is "tidak"');

    // Revert decision back to "lanjut"
    const khitbahPatch3 = {
      summaryReviewed: true,
      summaryReviewedDate: new Date().toISOString(),
      familyConsent: {
        selfFamilyAgreed: true,
        selfFamilyDate: '2026-11-20',
        selfFamilyNotes: 'Restu orang tua lengkap',
        partnerFamilyAgreed: true,
        partnerFamilyDate: '2026-11-22',
        partnerFamilyNotes: 'Keluarga menyambut baik',
      },
      eventDate: '2026-12-15',
      eventStartTime: '09:30',
      locationName: 'Kediaman Mempelai Wanita',
      locationAddress: 'Jl. Merdeka No. 45 Bandung',
      spokesperson: 'Drs. H. Mulyadi',
      decisions: {
        selfDecision: 'lanjut',
        partnerDecision: 'lanjut',
      },
    };

    const kRes3 = await fetch(`${BASE_URL}/api/m/khitbah`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(khitbahPatch3),
    });
    assert(kRes3.ok, 'Khitbah Stage 3 data updated');

    const resumedRouteRes = await fetch(`${BASE_URL}/api/route`, { headers: authHeaders });
    const resumedJson = await resumedRouteRes.json();
    assert(resumedJson.status === 'berjalan', 'Route resumed to "berjalan" when decision is "lanjut"');
    const req5b = getStageReq(resumedJson, 'kesepakatan-khitbah');
    assert(req5b && req5b.canComplete === true, 'Tahap 3 requirements are satisfied');

    // Complete Stage 3 -> Advance to Stage 4
    const compRes3 = await fetch(`${BASE_URL}/api/route/complete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ stageKey: 'kesepakatan-khitbah' }),
    });
    const compJson3 = await compRes3.json();
    assert(compRes3.ok, 'Stage 3 completed successfully');
    assert(compJson3.nextStage === 'proses-khitbah', `Advanced to proses-khitbah (got ${compJson3.nextStage})`);

    // 6. Tahap 4: Proses Khitbah (Seserahan, Rundown, Biaya, Pelaksanaan, Tanggal Akad)
    const routeRes6 = await fetch(`${BASE_URL}/api/route`, { headers: authHeaders });
    const routeJson6 = await routeRes6.json();
    assert(routeJson6.currentStage === 'proses-khitbah', 'Current stage is proses-khitbah');
    const req6 = getStageReq(routeJson6, 'proses-khitbah');
    assert(req6 && req6.canComplete === false, 'Tahap 4 initially cannot be completed');

    // Get current gifts and prep checklist
    const kDataRes4 = await fetch(`${BASE_URL}/api/m/khitbah`, { headers: authHeaders });
    const kDataJson4 = await kDataRes4.json();
    const giftsList = kDataJson4.data.gifts || [];
    const prepList = kDataJson4.data.prepChecklist || [];
    assert(giftsList.length > 0, `Seserahan default items exist: ${giftsList.length} items`);
    assert(prepList.length > 0, `Prep checklist default items exist: ${prepList.length} items`);

    // Mark all gifts as "dikemas", complete prep checklist, set execution & target wedding date
    const updatedGifts = giftsList.map((g) => ({ ...g, status: 'dikemas', actual: g.estimate }));
    const updatedPrep = prepList.map((p) => ({ ...p, completed: true }));

    const khitbahPatch4 = {
      gifts: updatedGifts,
      prepChecklist: updatedPrep,
      execution: {
        completed: true,
        executionDate: '2026-12-15',
        weddingTargetDate: '2027-04-18',
        notes: 'Acara lamaran berlangsung sangat khidmat dan penuh haru',
      },
    };

    const kRes4 = await fetch(`${BASE_URL}/api/m/khitbah`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(khitbahPatch4),
    });
    assert(kRes4.ok, 'Khitbah Stage 4 data updated');

    // Verify settings targetDate was synced
    const setRes = await fetch(`${BASE_URL}/api/m/settings`, { headers: authHeaders });
    const setJson = await setRes.json();
    assert(setJson.data.targetDate === '2027-04-18', `Wedding targetDate synced to settings: ${setJson.data.targetDate}`);

    // Check Stage 4 completion readiness
    const routeRes7 = await fetch(`${BASE_URL}/api/route`, { headers: authHeaders });
    const routeJson7 = await routeRes7.json();
    const req7 = getStageReq(routeJson7, 'proses-khitbah');
    assert(req7 && req7.canComplete === true, 'Tahap 4 requirements are satisfied');

    // Complete Stage 4 -> Advance to Stage 5
    const compRes4 = await fetch(`${BASE_URL}/api/route/complete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ stageKey: 'proses-khitbah' }),
    });
    const compJson4 = await compRes4.json();
    assert(compRes4.ok, 'Stage 4 completed successfully');
    assert(compJson4.nextStage === 'kesepakatan-akad', `Advanced to kesepakatan-akad (got ${compJson4.nextStage})`);

    // 7. Verify Stages 1 to 4 are marked completed and Stage 5 is active
    const finalRouteRes = await fetch(`${BASE_URL}/api/route`, { headers: authHeaders });
    const finalRoute = await finalRouteRes.json();
    assert(Boolean(finalRoute.completed['persetujuan-taaruf']), 'Stage 1 marked completed');
    assert(Boolean(finalRoute.completed['proses-taaruf']), 'Stage 2 marked completed');
    assert(Boolean(finalRoute.completed['kesepakatan-khitbah']), 'Stage 3 marked completed');
    assert(Boolean(finalRoute.completed['proses-khitbah']), 'Stage 4 marked completed');
    assert(finalRoute.currentStage === 'kesepakatan-akad', 'Stage 5 is now the active stage');

  } catch (err) {
    console.error('Unhandled test exception:', err);
    failed++;
  }

  console.log('\n=======================================');
  console.log(`FASE 2 TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('=======================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
