import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// URL por defecto para build (se sobrescribe en runtime)
const databaseUrl = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
})
