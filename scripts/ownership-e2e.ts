const BASE =
  process.env.BASE_URL?.replace(/\/$/, "") ||
  `https://${process.env.REPLIT_DEV_DOMAIN || "localhost:5000"}`;

const COOKIE_A = process.env.USER_A_COOKIE;
const COOKIE_B = process.env.USER_B_COOKIE;

if (!COOKIE_A || !COOKIE_B) {
  console.error(
    "ERROR: Set USER_A_COOKIE and USER_B_COOKIE env vars.\n" +
      "  Copy the full Cookie header from browser devtools " +
      '(e.g. connect.sid=s%3A...).\n'
  );
  process.exit(1);
}

interface TestResult {
  name: string;
  passed: boolean;
  detail?: string;
}

const results: TestResult[] = [];

function pass(name: string) {
  results.push({ name, passed: true });
  console.log(`  PASS  ${name}`);
}
function fail(name: string, detail: string) {
  results.push({ name, passed: false, detail });
  console.log(`  FAIL  ${name}  ->  ${detail}`);
}

async function api(
  method: string,
  path: string,
  cookie: string,
  body?: unknown
): Promise<{ status: number; json: any }> {
  const opts: RequestInit = {
    method,
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const res = await fetch(`${BASE}${path}`, opts);
  let json: any;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

function expectStatus(
  label: string,
  endpoint: string,
  expected: number | number[],
  actual: number,
  body: any
) {
  const ok = Array.isArray(expected)
    ? expected.includes(actual)
    : actual === expected;
  const expectStr = Array.isArray(expected) ? expected.join("/") : expected;
  if (ok) {
    pass(`${label}: ${endpoint} -> ${actual}`);
  } else {
    fail(
      `${label}: ${endpoint}`,
      `Expected ${expectStr}, got ${actual} | body=${JSON.stringify(body)}`
    );
  }
}

async function verifyAuth() {
  console.log("\n-- Verifying auth cookies --");
  const a = await api("GET", "/api/auth/user", COOKIE_A!);
  if (!a.json?.id) {
    console.error("USER_A_COOKIE is invalid (no user returned). Aborting.");
    process.exit(1);
  }
  console.log(`  User A: ${a.json.username || a.json.id}`);

  const b = await api("GET", "/api/auth/user", COOKIE_B!);
  if (!b.json?.id) {
    console.error("USER_B_COOKIE is invalid (no user returned). Aborting.");
    process.exit(1);
  }
  console.log(`  User B: ${b.json.username || b.json.id}`);

  if (a.json.id === b.json.id) {
    console.error(
      "Both cookies resolve to the SAME user! Use different identities."
    );
    process.exit(1);
  }
}

async function runDirection(
  label: string,
  ownerCookie: string,
  intruderCookie: string
) {
  console.log(`\n-- ${label}: owner creates resources --`);

  const progName = `OWNERSHIP-TEST-${label}-${Date.now()}`;
  const { status: pStatus, json: prog } = await api(
    "POST",
    "/api/programs",
    ownerCookie,
    { name: progName, description: "e2e ownership test" }
  );
  if (pStatus !== 201 || !prog?.id) {
    fail(
      `${label}: create program`,
      `status=${pStatus} body=${JSON.stringify(prog)}`
    );
    return { programId: null, workoutId: null, rowId: null, progName };
  }
  pass(`${label}: owner created program "${progName}" (id=${prog.id})`);

  const { status: wStatus, json: workout } = await api(
    "POST",
    "/api/workouts",
    ownerCookie,
    { programId: prog.id, name: "Test Workout", orderIndex: 0 }
  );
  if (wStatus !== 201 || !workout?.id) {
    fail(
      `${label}: create workout`,
      `status=${wStatus} body=${JSON.stringify(workout)}`
    );
    return { programId: prog.id, workoutId: null, rowId: null, progName };
  }
  pass(`${label}: owner created workout (id=${workout.id})`);

  const { status: rStatus, json: row } = await api(
    "POST",
    "/api/workout-rows",
    ownerCookie,
    {
      workoutId: workout.id,
      orderLabel: "1a",
      liftName: "Test Squat",
      sets: "3",
      reps: "5",
      movementFamily: "Squat",
    }
  );
  if (rStatus !== 201 || !row?.id) {
    fail(
      `${label}: create workout row`,
      `status=${rStatus} body=${JSON.stringify(row)}`
    );
    return {
      programId: prog.id,
      workoutId: workout.id,
      rowId: null,
      progName,
    };
  }
  pass(`${label}: owner created workout row (id=${row.id})`);

  console.log(`\n-- ${label}: intruder attempts --`);

  const { json: listJson } = await api("GET", "/api/programs", intruderCookie);
  const found =
    Array.isArray(listJson) && listJson.some((p: any) => p.id === prog.id);
  if (found) {
    fail(
      `${label}: GET /api/programs (list)`,
      `Program id=${prog.id} "${progName}" visible in intruder's list`
    );
  } else {
    pass(`${label}: GET /api/programs does NOT include program`);
  }

  const gp = await api("GET", `/api/programs/${prog.id}`, intruderCookie);
  expectStatus(label, `GET /api/programs/${prog.id}`, 404, gp.status, gp.json);

  const pp = await api("PATCH", `/api/programs/${prog.id}`, intruderCookie, {
    name: "HACKED",
  });
  expectStatus(label, `PATCH /api/programs/${prog.id}`, 404, pp.status, pp.json);

  const dp = await api("DELETE", `/api/programs/${prog.id}`, intruderCookie);
  expectStatus(label, `DELETE /api/programs/${prog.id}`, 404, dp.status, dp.json);

  const gw = await api("GET", `/api/workouts/${workout.id}`, intruderCookie);
  expectStatus(label, `GET /api/workouts/${workout.id}`, 404, gw.status, gw.json);

  const pw = await api("PATCH", `/api/workouts/${workout.id}`, intruderCookie, {
    name: "HACKED WKT",
  });
  expectStatus(label, `PATCH /api/workouts/${workout.id}`, 404, pw.status, pw.json);

  const dw = await api("DELETE", `/api/workouts/${workout.id}`, intruderCookie);
  expectStatus(label, `DELETE /api/workouts/${workout.id}`, 404, dw.status, dw.json);

  const cw = await api(
    "POST",
    `/api/workouts/${workout.id}/complete`,
    intruderCookie
  );
  expectStatus(
    label,
    `POST /api/workouts/${workout.id}/complete`,
    404,
    cw.status,
    cw.json
  );

  const pr = await api(
    "PATCH",
    `/api/workout-rows/${row.id}`,
    intruderCookie,
    { liftName: "HACKED LIFT" }
  );
  expectStatus(label, `PATCH /api/workout-rows/${row.id}`, 404, pr.status, pr.json);

  const dr = await api(
    "DELETE",
    `/api/workout-rows/${row.id}`,
    intruderCookie
  );
  expectStatus(label, `DELETE /api/workout-rows/${row.id}`, 404, dr.status, dr.json);

  const ar = await api("POST", "/api/workout-rows", intruderCookie, {
    workoutId: workout.id,
    orderLabel: "2a",
    liftName: "Intruder Lift",
    sets: "1",
    reps: "1",
  });
  expectStatus(
    label,
    `POST /api/workout-rows (on owner's workout)`,
    [403, 404],
    ar.status,
    ar.json
  );

  const aw = await api("POST", "/api/workouts", intruderCookie, {
    programId: prog.id,
    name: "Intruder Workout",
    orderIndex: 99,
  });
  expectStatus(
    label,
    `POST /api/workouts (on owner's program)`,
    [403, 404],
    aw.status,
    aw.json
  );

  return { programId: prog.id, workoutId: workout.id, rowId: row.id, progName };
}

async function cleanup(
  cookie: string,
  programId: number | null,
  label: string
) {
  if (!programId) return;
  const { status } = await api("DELETE", `/api/programs/${programId}`, cookie);
  if (status === 200) {
    console.log(`  [cleanup] ${label}: deleted program ${programId}`);
  } else {
    console.log(
      `  [cleanup] ${label}: failed to delete program ${programId} (status=${status})`
    );
  }
}

async function main() {
  console.log("========================================");
  console.log("  Ownership E2E - Cross-User Isolation  ");
  console.log("========================================");
  console.log(`Base URL: ${BASE}`);

  await verifyAuth();

  const dirA = await runDirection("A->B", COOKIE_A!, COOKIE_B!);
  const dirB = await runDirection("B->A", COOKIE_B!, COOKIE_A!);

  console.log("\n-- Cleanup --");
  await cleanup(COOKIE_A!, dirA.programId, "A");
  await cleanup(COOKIE_B!, dirB.programId, "B");

  console.log("\n========================================");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`  TOTAL: ${results.length}  |  PASSED: ${passed}  |  FAILED: ${failed}`);
  if (failed > 0) {
    console.log("\n  FAILURES:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`    FAIL  ${r.name}: ${r.detail}`));
    console.log("\n  RESULT: FAIL");
    process.exit(1);
  } else {
    console.log("\n  RESULT: ALL PASS");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
