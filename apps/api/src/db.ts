import { PrismaPg } from '@prisma/adapter-pg'
import { env } from './env'
import { Prisma, PrismaClient } from './generated/prisma/client'

/** Raised for any query when no database is configured (DATABASE_URL unset). */
export class DatabaseUnavailableError extends Error {
  constructor() { super('DATABASE_URL is not set.') }
}

// With no DATABASE_URL the API still runs (the .env Admin can sign in), and every query fails fast with
// DatabaseUnavailableError — reported to clients as "database not connected" rather than a crash.
function disconnectedClient(): PrismaClient {
  const fail = () => Promise.reject(new DatabaseUnavailableError())
  const model: ProxyHandler<object> = { get: () => fail }
  return new Proxy({}, {
    get: (_, key) => (key === '$disconnect' || key === '$connect' ? async () => {} : typeof key === 'string' && key.startsWith('$') ? fail : new Proxy({}, model)),
  }) as PrismaClient
}

export const prisma = env.DATABASE_URL ? new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) }) : disconnectedClient()

/** True when an error means the database is missing or unreachable (not a problem with the query itself). */
export function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof DatabaseUnavailableError || error instanceof Prisma.PrismaClientInitializationError) return true
  // P1000 auth failed · P1001 unreachable · P1002 timeout · P1003 database missing · P1010 access denied · P1017 connection closed
  if (error instanceof Prisma.PrismaClientKnownRequestError && ['P1000', 'P1001', 'P1002', 'P1003', 'P1010', 'P1017'].includes(error.code)) return true
  // P2021: the tables don't exist yet (migrations not run).
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') return true
  const text = `${(error as { code?: string })?.code ?? ''} ${(error as Error)?.message ?? ''}`
  // Raw queries surface the PostgreSQL code: 28000/28P01 login rejected, 3D000 no such database, 08xxx connection, 42P01 no such table.
  return /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EHOSTUNREACH|Can't reach database|DatabaseNotReachable|DatabaseAccessDenied|DatabaseDoesNotExist|Code: `(28000|28P01|3D000|08\w{3}|42P01)`/.test(text)
}

export * from './generated/prisma/client'
