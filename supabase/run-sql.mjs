// Corre un archivo .sql directo contra la base de datos de Supabase, usando DATABASE_URL de .env.
// Uso: node supabase/run-sql.mjs ruta/al/archivo.sql
// Uso (SQL inline): node supabase/run-sql.mjs --inline "select 1"
import { readFileSync } from 'node:fs'
import { Client } from 'pg'
import 'dotenv/config'

const arg = process.argv[2]
const inlineFlag = process.argv[2] === '--inline'
const sql = inlineFlag ? process.argv[3] : readFileSync(arg, 'utf8')

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL en .env')
  process.exit(1)
}

const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  const result = await client.query(sql)
  const results = Array.isArray(result) ? result : [result]
  for (const r of results) {
    if (r.rows?.length) console.log(r.rows)
  }
  console.log(`OK — ${inlineFlag ? 'consulta' : arg} ejecutado sin errores.`)
} catch (err) {
  console.error('ERROR:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
