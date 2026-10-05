// Creates (or resets the password of) an additional Admin user stored in the database.
// The main login comes from ADMIN_EMAIL / ADMIN_PASSWORD in .env and needs no command.
//   npm run admin:create -- --email you@company.com --name "Your Name" [--role ADMIN|EDITOR]
// The password is read from NEW_USER_PASSWORD if set, otherwise prompted for without echo.
import { createInterface } from 'node:readline'
import { parseArgs } from 'node:util'
import { hashPassword, isEnvAdmin, isStrongPassword, passwordRule } from '../src/lib/auth'
import { prisma } from '../src/db'

const { values } = parseArgs({ options: { email: { type: 'string' }, name: { type: 'string' }, role: { type: 'string', default: 'ADMIN' } } })
const email = values.email?.trim().toLowerCase()
const role = values.role === 'EDITOR' ? 'EDITOR' : 'ADMIN'
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run admin:create -- --email you@company.com --name "Your Name" [--role ADMIN|EDITOR]')
  process.exit(1)
}
if (isEnvAdmin(email)) {
  console.error(`${email} is the .env Admin — change its password with ADMIN_PASSWORD in .env, then restart the API.`)
  process.exit(1)
}

function promptHidden(question: string) {
  return new Promise<string>(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    const output = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream }
    output._writeToOutput = (s: string) => { if (s.includes(question)) output.output.write(s) }
    rl.question(question, answer => { rl.close(); process.stdout.write('\n'); resolve(answer) })
  })
}

const password = process.env.NEW_USER_PASSWORD || await promptHidden('Password (min. 12 characters): ')
if (!isStrongPassword(password)) { console.error(`Password rejected: ${passwordRule}.`); process.exit(1) }

const passwordHash = await hashPassword(password)
const existing = await prisma.adminUser.findUnique({ where: { email } })
if (existing) {
  await prisma.adminUser.update({ where: { email }, data: { passwordHash, active: true, ...(values.name ? { name: values.name } : {}) } })
  await prisma.session.deleteMany({ where: { userId: existing.id } })
  console.log(`Password reset for ${email}; existing sessions signed out.`)
} else {
  await prisma.adminUser.create({ data: { email, name: values.name?.trim() || email.split('@')[0], role, passwordHash } })
  console.log(`Created ${role} user ${email}.`)
}
await prisma.$disconnect()
