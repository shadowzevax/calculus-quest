// Código de 4 dígitos que el docente comparte con los estudiantes para poder
// registrarse. Se rota solo cada cierto tiempo (rotación perezosa: se calcula
// al leerlo, no con un cron, porque esto corre en funciones serverless).
const ROTATE_MS = 10 * 60 * 1000; // 10 minutos
const SETTINGS_KEY = 'reg_code';

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function readState(sql) {
  const [row] = await sql`SELECT value FROM app_settings WHERE key = ${SETTINGS_KEY}`;
  if (!row) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

async function writeState(sql, state) {
  const value = JSON.stringify(state);
  await sql`
    INSERT INTO app_settings (key, value) VALUES (${SETTINGS_KEY}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = ${value}
  `;
}

// Devuelve el código vigente, generando uno nuevo si no existe o si ya venció.
export async function getCurrentCode(sql) {
  const state = await readState(sql);
  const now = Date.now();
  if (state && now - state.generated_at < ROTATE_MS) return state;
  const fresh = { code: generateCode(), generated_at: now };
  await writeState(sql, fresh);
  return fresh;
}

// Fuerza un código nuevo sin importar cuánto falte para la rotación automática.
export async function regenerateCode(sql) {
  const fresh = { code: generateCode(), generated_at: Date.now() };
  await writeState(sql, fresh);
  return fresh;
}

export async function isCodeValid(sql, inputCode) {
  if (!inputCode) return false;
  const state = await getCurrentCode(sql);
  return String(inputCode).trim() === state.code;
}

export const REG_CODE_ROTATE_MS = ROTATE_MS;
