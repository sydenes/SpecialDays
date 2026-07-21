import { pool } from "../pool.js";
import {
  mapPageMessageAdminRow,
  mapPageMessageRow,
  type AttendanceStatus,
  type PageMessage,
  type PageMessageAdmin,
} from "../../entities/pageMessages.entity.js";

type PageMessageRow = {
  id: string;
  authorName: string;
  authorEmail: string | null;
  messageText: string;
  attendanceStatus: AttendanceStatus | null;
  guestCount: number | null;
  declineReason: string | null;
  isApproved?: boolean;
  approvedAt?: Date | null;
  createdAt: Date;
};

const MESSAGE_SELECT = `
  m.id,
  m.author_name AS "authorName",
  m.author_email AS "authorEmail",
  m.message_text AS "messageText",
  m.attendance_status AS "attendanceStatus",
  m.guest_count AS "guestCount",
  m.decline_reason AS "declineReason",
  m.created_at AS "createdAt"
`;

const MESSAGE_RETURNING = `
  id,
  author_name AS "authorName",
  author_email AS "authorEmail",
  message_text AS "messageText",
  attendance_status AS "attendanceStatus",
  guest_count AS "guestCount",
  decline_reason AS "declineReason",
  is_approved AS "isApproved",
  approved_at AS "approvedAt",
  created_at AS "createdAt"
`;

export async function getApprovedMessagesBySlug(slug: string): Promise<PageMessage[]> {
  const { rows } = await pool.query(
    `
    SELECT
      ${MESSAGE_SELECT}
    FROM page_messages m
    JOIN special_pages sp ON sp.id = m.page_id
    WHERE sp.slug = $1
      AND sp.status = 'published'
      AND sp.deleted_at IS NULL
      AND m.is_approved = TRUE
    ORDER BY m.created_at ASC
    `,
    [slug]
  );

  return (rows as PageMessageRow[]).map((r) => mapPageMessageRow(r));
}

export type CreatePageMessageInput = {
  authorName: string;
  authorEmail?: string | null;
  messageText: string;
  attendanceStatus: AttendanceStatus;
  guestCount?: number | null;
  declineReason?: string | null;
};

/** Ziyaretçi mesajı — onay bekler */
export async function createPendingMessageBySlug(
  slug: string,
  input: CreatePageMessageInput
): Promise<PageMessageAdmin> {
  const {
    authorName,
    authorEmail = null,
    messageText,
    attendanceStatus,
    guestCount = null,
    declineReason = null,
  } = input;

  const { rows } = await pool.query(
    `
    INSERT INTO page_messages (
      page_id,
      author_name,
      author_email,
      message_text,
      attendance_status,
      guest_count,
      decline_reason,
      is_approved,
      approved_at
    )
    SELECT sp.id, $1, $2, $3, $4, $5, $6, FALSE, NULL
    FROM special_pages sp
    WHERE sp.slug = $7 AND sp.status = 'published' AND sp.deleted_at IS NULL
    RETURNING ${MESSAGE_RETURNING}
    `,
    [authorName, authorEmail, messageText, attendanceStatus, guestCount, declineReason, slug]
  );

  if (rows.length === 0) throw new Error("Page not found");
  return mapPageMessageAdminRow(rows[0] as PageMessageRow & { isApproved: boolean; approvedAt: Date | null });
}

export async function listMessagesForPageId(pageId: string): Promise<PageMessageAdmin[]> {
  const { rows } = await pool.query(
    `
    SELECT
      ${MESSAGE_SELECT},
      m.is_approved AS "isApproved",
      m.approved_at AS "approvedAt"
    FROM page_messages m
    WHERE m.page_id = $1
    ORDER BY m.is_approved ASC, m.created_at DESC
    `,
    [pageId]
  );
  return (rows as PageMessageRow[]).map((r) =>
    mapPageMessageAdminRow(r as PageMessageRow & { isApproved: boolean; approvedAt: Date | null })
  );
}

export async function countPendingMessagesForPageId(pageId: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM page_messages WHERE page_id = $1 AND is_approved = FALSE`,
    [pageId]
  );
  return (rows[0] as { c: number }).c ?? 0;
}

export async function approvePageMessage(pageId: string, messageId: string): Promise<PageMessageAdmin | null> {
  const { rows } = await pool.query(
    `
    UPDATE page_messages
    SET is_approved = TRUE, approved_at = NOW()
    WHERE id = $2 AND page_id = $1
    RETURNING ${MESSAGE_RETURNING}
    `,
    [pageId, messageId]
  );
  if (rows.length === 0) return null;
  return mapPageMessageAdminRow(rows[0] as PageMessageRow & { isApproved: boolean; approvedAt: Date | null });
}

export async function deletePageMessage(pageId: string, messageId: string): Promise<boolean> {
  const { rowCount } = await pool.query(`DELETE FROM page_messages WHERE id = $2 AND page_id = $1`, [
    pageId,
    messageId,
  ]);
  return (rowCount ?? 0) > 0;
}
