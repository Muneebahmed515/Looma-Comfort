import 'server-only'
import { neon, types, type NeonQueryFunction } from '@neondatabase/serverless'
import { DATABASE_URL } from '../env'
import type { Row, Statement } from './sql'

export { col, insertSql, table, updateSql, type Row, type Statement } from './sql'

/**
 * Neon serverless driver over HTTP (one fetch per query, no connection pool to manage).
 * Rows come back in the same shapes the site used before: timestamps as ISO strings,
 * dates as "YYYY-MM-DD", bigint ids/counts as numbers.
 */
const OID = { int8: 20, date: 1082, timestamp: 1114, timestamptz: 1184 } as const

function isoTimestamp(value: string): string {
  const d = new Date(value.replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00'))
  return Number.isNaN(d.getTime()) ? value : d.toISOString()
}

const typeParsers = {
  getTypeParser(oid: number, format?: 'text' | 'binary') {
    if (oid === OID.timestamptz || oid === OID.timestamp) return isoTimestamp
    if (oid === OID.date) return (v: string) => v
    if (oid === OID.int8) return (v: string) => Number(v)
    return types.getTypeParser(oid, format)
  },
}

let client: NeonQueryFunction<false, false> | null = null

export function db(): NeonQueryFunction<false, false> {
  if (!DATABASE_URL) throw new Error('DATABASE_URL is not configured')
  if (!client) client = neon(DATABASE_URL)
  return client
}

/** Runs a parameterised query ($1, $2, …) and returns the rows. */
export async function query<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  // The driver only applies custom type parsers given per query.
  return (await db().query(text, params, { types: typeParsers })) as T[]
}

export async function queryOne<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  return (await query<T>(text, params))[0] ?? null
}

/** Runs several read queries in one round trip (one HTTP request, one read-only transaction). */
export async function queryBatch(statements: Statement[]): Promise<Row[][]> {
  const sql = db()
  return (await sql.transaction(
    statements.map((s) => sql.query(s.text, s.params, { types: typeParsers })),
    { readOnly: true },
  )) as Row[][]
}

/** The signed-in admin, recorded by the activity-log trigger for every change in the transaction. */
export interface Actor {
  id: string
  email: string
}

/**
 * Runs statements in one transaction. With an actor, the activity log records who made the change.
 * Returns the rows of each statement (actor setup excluded).
 */
export async function transaction(statements: Statement[], actor?: Actor): Promise<Row[][]> {
  const sql = db()
  const all = [
    ...(actor
      ? [{ text: `select set_config('app.user_id', $1, true), set_config('app.user_email', $2, true)`, params: [actor.id, actor.email] }]
      : []),
    ...statements,
  ]
  const results = (await sql.transaction(all.map((s) => sql.query(s.text, s.params, { types: typeParsers })))) as Row[][]
  return actor ? results.slice(1) : results
}

/** Readable message for a Postgres error. */
export function dbErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
