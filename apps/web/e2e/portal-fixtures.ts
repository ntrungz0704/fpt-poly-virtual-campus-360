import fs from "node:fs";
import path from "node:path";
import argon2 from "argon2";
import dotenv from "dotenv";
import pg from "pg";

const repoRoot = path.resolve(process.cwd(), "..", "..");

export interface PortalFixtures {
  studentA: { id: string; username: string; email: string; password: string };
  studentB: { id: string; username: string; email: string; password: string };
  parentA: { id: string; username: string; email: string; password: string };
  parentB: { id: string; username: string; email: string; password: string };
  parentC: { id: string; username: string; email: string; password: string };
  pendingLinkId: string;
  approvedLinkId: string;
}

export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(repoRoot, ".env");
  if (fs.existsSync(envPath)) {
    const parsed = dotenv.parse(fs.readFileSync(envPath, "utf8"));
    if (parsed.DATABASE_URL) return parsed.DATABASE_URL;
  }
  throw new Error("DATABASE_URL is required to run E2E portal tests.");
}

export async function ensurePortalTestFixtures(customDbUrl?: string): Promise<PortalFixtures> {
  const dbUrl = customDbUrl || getDatabaseUrl();
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();

  try {
    const hashOptions = {
      type: argon2.argon2id as 2,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    };

    const studentPass = "StudentPass-2026!";
    const parentPass = "ParentPass-2026!";
    const studentHash = await argon2.hash(studentPass, hashOptions);
    const parentHash = await argon2.hash(parentPass, hashOptions);

    // Clean up any previous test fixture records cleanly
    const prevUsers = await client.query(
      `SELECT id FROM users WHERE email LIKE '%@test.poly.edu.vn' OR username LIKE 'e2e_%';`,
    );
    const prevIds = prevUsers.rows.map((r) => r.id);
    if (prevIds.length > 0) {
      await client.query(`DELETE FROM refresh_tokens WHERE user_id = ANY($1);`, [prevIds]);
      await client.query(`DELETE FROM audit_logs WHERE actor_user_id = ANY($1);`, [prevIds]);
      await client.query(`DELETE FROM parent_student_links WHERE parent_id = ANY($1) OR student_id = ANY($1);`, [prevIds]);
      await client.query(`DELETE FROM user_spin_histories WHERE user_id = ANY($1);`, [prevIds]);
      await client.query(`DELETE FROM xp_ledgers WHERE user_id = ANY($1) OR ticket_code LIKE 'OD26-TEST-%';`, [prevIds]);
      await client.query(`DELETE FROM quiz_attempts WHERE user_id = ANY($1);`, [prevIds]);
      await client.query(`DELETE FROM event_participations WHERE user_id = ANY($1) OR ticket_code LIKE 'OD26-TEST-%';`, [prevIds]);
      await client.query(`DELETE FROM user_roles WHERE user_id = ANY($1);`, [prevIds]);
      await client.query(`DELETE FROM users WHERE id = ANY($1);`, [prevIds]);
    }

    // 1. Insert Student A
    const resA = await client.query(
      `INSERT INTO users (id, username, full_name, email, phone, student_code, major, password_hash, user_type, account_status, activation_status, provisioning_method, must_change_password, created_at, updated_at)
       VALUES (gen_random_uuid(), 'e2e_student_a', 'Sinh Vien A Test', 'e2e.student.a@test.poly.edu.vn', '+84901999001', 'SV-TEST-001', 'Công nghệ Thông tin', $1, 'STUDENT', 'ACTIVE', 'ACTIVATED', 'ADMIN_DIRECT', false, NOW(), NOW())
       RETURNING id;`,
      [studentHash],
    );
    const studentAId = resA.rows[0].id;

    // 2. Insert Student B
    const resB = await client.query(
      `INSERT INTO users (id, username, full_name, email, phone, student_code, major, password_hash, user_type, account_status, activation_status, provisioning_method, must_change_password, created_at, updated_at)
       VALUES (gen_random_uuid(), 'e2e_student_b', 'Sinh Vien B Test', 'e2e.student.b@test.poly.edu.vn', '+84901999002', 'SV-TEST-002', 'Thiết kế Đồ họa', $1, 'STUDENT', 'ACTIVE', 'ACTIVATED', 'ADMIN_DIRECT', false, NOW(), NOW())
       RETURNING id;`,
      [studentHash],
    );
    const studentBId = resB.rows[0].id;

    // 3. Insert Parent A (Unlinked)
    const resPA = await client.query(
      `INSERT INTO users (id, username, full_name, email, phone, password_hash, user_type, account_status, activation_status, provisioning_method, must_change_password, created_at, updated_at)
       VALUES (gen_random_uuid(), 'e2e_parent_a', 'Phu Huynh A Unlinked', 'e2e.parent.a@test.poly.edu.vn', '+84901999003', $1, 'PARENT', 'ACTIVE', 'ACTIVATED', 'ADMIN_DIRECT', false, NOW(), NOW())
       RETURNING id;`,
      [parentHash],
    );
    const parentAId = resPA.rows[0].id;

    // 4. Insert Parent B (APPROVED with Student A)
    const resPB = await client.query(
      `INSERT INTO users (id, username, full_name, email, phone, password_hash, user_type, account_status, activation_status, provisioning_method, must_change_password, created_at, updated_at)
       VALUES (gen_random_uuid(), 'e2e_parent_b', 'Phu Huynh B Approved', 'e2e.parent.b@test.poly.edu.vn', '+84901999004', $1, 'PARENT', 'ACTIVE', 'ACTIVATED', 'ADMIN_DIRECT', false, NOW(), NOW())
       RETURNING id;`,
      [parentHash],
    );
    const parentBId = resPB.rows[0].id;

    // 5. Insert Parent C (PENDING with Student A)
    const resPC = await client.query(
      `INSERT INTO users (id, username, full_name, email, phone, password_hash, user_type, account_status, activation_status, provisioning_method, must_change_password, created_at, updated_at)
       VALUES (gen_random_uuid(), 'e2e_parent_c', 'Phu Huynh C Pending', 'e2e.parent.c@test.poly.edu.vn', '+84901999005', $1, 'PARENT', 'ACTIVE', 'ACTIVATED', 'ADMIN_DIRECT', false, NOW(), NOW())
       RETURNING id;`,
      [parentHash],
    );
    const parentCId = resPC.rows[0].id;

    // 6. Parent-Student Links
    const resLinkB = await client.query(
      `INSERT INTO parent_student_links (id, parent_id, student_id, status, relationship, notes, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, 'APPROVED', 'Phụ huynh ruột', 'Đã xác minh hộ khẩu', NOW(), NOW())
       RETURNING id;`,
      [parentBId, studentAId],
    );
    const approvedLinkId = resLinkB.rows[0].id;

    const resLinkC = await client.query(
      `INSERT INTO parent_student_links (id, parent_id, student_id, status, relationship, notes, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, 'PENDING', 'Người giám hộ', 'Chờ duyệt', NOW(), NOW())
       RETURNING id;`,
      [parentCId, studentAId],
    );
    const pendingLinkId = resLinkC.rows[0].id;

    // 7. Ensure Open Day ticket & XP for Student A
    const eventRes = await client.query(
      `SELECT id FROM open_day_events WHERE deleted_at IS NULL ORDER BY is_default DESC, created_at ASC LIMIT 1;`,
    );
    if (eventRes.rows.length > 0) {
      const eventId = eventRes.rows[0].id;

      await client.query(
        `INSERT INTO event_participations (id, user_id, event_id, ticket_code, attendee_name, attendee_email, participation_status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'OD26-TEST-STUA', 'Sinh Vien A Test', 'e2e.student.a@test.poly.edu.vn', 'CONFIRMED', NOW(), NOW())
         ON CONFLICT (ticket_code) DO UPDATE SET user_id = EXCLUDED.user_id;`,
        [studentAId, eventId],
      );

      await client.query(
        `INSERT INTO event_participations (id, user_id, event_id, ticket_code, attendee_name, attendee_email, participation_status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'OD26-TEST-STUB', 'Sinh Vien B Test', 'e2e.student.b@test.poly.edu.vn', 'CONFIRMED', NOW(), NOW())
         ON CONFLICT (ticket_code) DO UPDATE SET user_id = EXCLUDED.user_id;`,
        [studentBId, eventId],
      );
    }

    // Insert XP ledgers for Student A (total 120 XP across 3 records)
    await client.query(
      `DELETE FROM xp_ledgers WHERE user_id = $1 OR ticket_code = 'OD26-TEST-STUA';`,
      [studentAId],
    );
    await client.query(
      `INSERT INTO xp_ledgers (id, user_id, ticket_code, attendee_name, amount_xp, source, reference_id, created_at)
       VALUES
         (gen_random_uuid(), $1, 'OD26-TEST-STUA', 'Sinh Vien A Test', 40, 'QUIZ_COMPLETION', 'quiz-1', NOW() - interval '2 hours'),
         (gen_random_uuid(), $1, 'OD26-TEST-STUA', 'Sinh Vien A Test', 40, 'CHECK_IN', 'checkin-1', NOW() - interval '1 hour'),
         (gen_random_uuid(), $1, 'OD26-TEST-STUA', 'Sinh Vien A Test', 40, 'SPIN_WHEEL', 'spin-1', NOW());`,
      [studentAId],
    );

    // Insert XP ledgers for Student B (total 80 XP across 2 records)
    await client.query(
      `DELETE FROM xp_ledgers WHERE user_id = $1 OR ticket_code = 'OD26-TEST-STUB';`,
      [studentBId],
    );
    await client.query(
      `INSERT INTO xp_ledgers (id, user_id, ticket_code, attendee_name, amount_xp, source, reference_id, created_at)
       VALUES
         (gen_random_uuid(), $1, 'OD26-TEST-STUB', 'Sinh Vien B Test', 50, 'QUIZ_COMPLETION', 'quiz-2', NOW() - interval '1 hour'),
         (gen_random_uuid(), $1, 'OD26-TEST-STUB', 'Sinh Vien B Test', 30, 'SPIN_WHEEL', 'spin-2', NOW());`,
      [studentBId],
    );

    return {
      studentA: { id: studentAId, username: "e2e_student_a", email: "e2e.student.a@test.poly.edu.vn", password: studentPass },
      studentB: { id: studentBId, username: "e2e_student_b", email: "e2e.student.b@test.poly.edu.vn", password: studentPass },
      parentA: { id: parentAId, username: "e2e_parent_a", email: "e2e.parent.a@test.poly.edu.vn", password: parentPass },
      parentB: { id: parentBId, username: "e2e_parent_b", email: "e2e.parent.b@test.poly.edu.vn", password: parentPass },
      parentC: { id: parentCId, username: "e2e_parent_c", email: "e2e.parent.c@test.poly.edu.vn", password: parentPass },
      pendingLinkId,
      approvedLinkId,
    };
  } finally {
    await client.end();
  }
}

export async function cleanupPortalTestFixtures(customDbUrl?: string): Promise<void> {
  const dbUrl = customDbUrl || getDatabaseUrl();
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  try {
    const userRows = await client.query(
      `SELECT id FROM users WHERE email LIKE '%@test.poly.edu.vn';`,
    );
    const userIds = userRows.rows.map((r) => r.id);
    if (userIds.length > 0) {
      await client.query(`DELETE FROM refresh_tokens WHERE user_id = ANY($1);`, [userIds]);
      await client.query(`DELETE FROM audit_logs WHERE actor_user_id = ANY($1);`, [userIds]);
      await client.query(`DELETE FROM parent_student_links WHERE parent_id = ANY($1) OR student_id = ANY($1);`, [userIds]);
      await client.query(`DELETE FROM user_spin_histories WHERE user_id = ANY($1);`, [userIds]);
      await client.query(`DELETE FROM xp_ledgers WHERE user_id = ANY($1);`, [userIds]);
      await client.query(`DELETE FROM quiz_attempts WHERE user_id = ANY($1);`, [userIds]);
      await client.query(`DELETE FROM event_participations WHERE user_id = ANY($1);`, [userIds]);
      await client.query(`DELETE FROM user_roles WHERE user_id = ANY($1);`, [userIds]);
      await client.query(`DELETE FROM users WHERE id = ANY($1);`, [userIds]);
    }
  } finally {
    await client.end();
  }
}
