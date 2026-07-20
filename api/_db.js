// Cliente de conexión a Neon (Postgres). sql`SELECT ... ${id}` arma la
// consulta parametrizada sola, evitando inyección SQL.
import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL);
