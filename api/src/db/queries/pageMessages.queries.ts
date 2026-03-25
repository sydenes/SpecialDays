import { pool } from "../pool.js";
import { mapPageMessageRow, type PageMessage } from "../../entities/pageMessages.entity.js";

type PageMessageRow = {
  id: string;
  authorName: string;
  authorEmail: string | null;
  messageText: string;
  createdAt: Date;
};

export async function getApprovedMessagesBySlug(slug: string): Promise<PageMessage[]> {
  const { rows } = await pool.query(
    `
    SELECT
      m.id,
      m.author_name AS "authorName",
      m.author_email AS "authorEmail",
      m.message_text AS "messageText",
      m.created_at AS "createdAt"
    FROM page_messages m
    JOIN special_pages sp ON sp.id = m.page_id
    WHERE sp.slug = $1
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
};

export async function createApprovedMessageBySlug(
  slug: string,
  input: CreatePageMessageInput
): Promise<PageMessage> {
  const { authorName, authorEmail = null, messageText } = input;

  const { rows } = await pool.query(
    `
    INSERT INTO page_messages (page_id, author_name, author_email, message_text, is_approved, approved_at)
    SELECT
      sp.id,
      $1,
      $2,
      $3,
      TRUE,
      NOW()
    FROM special_pages sp
    WHERE sp.slug = $4
    RETURNING
      id,
      author_name AS "authorName",
      author_email AS "authorEmail",
      message_text AS "messageText",
      created_at AS "createdAt"
    `,
    [authorName, authorEmail, messageText, slug]
  );

  if (rows.length === 0) {
    throw new Error("Page not found");
  }

  return mapPageMessageRow((rows[0] as unknown) as PageMessageRow);
}

