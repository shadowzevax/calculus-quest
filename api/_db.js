// Cliente de conexión a nuestra base de datos Postgres en Neon.
// `neon()` crea una función especial llamada "tagged template" que nos deja
// escribir SQL casi normal, ej: sql`SELECT * FROM users WHERE id = ${id}`.
// Internamente arma la consulta como parametrizada (evita inyección SQL:
// nunca se debe concatenar strings a mano para armar el SQL).
// DATABASE_URL viene de una variable de entorno (definida en .env local y
// en Vercel > Settings > Environment Variables), así la contraseña de la
// base de datos nunca queda escrita en el código fuente.
import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL);
