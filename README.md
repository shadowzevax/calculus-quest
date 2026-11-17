# FuncionLab

Plataforma web gamificada para practicar cálculo diferencial aplicado a funciones de variable real. Es el producto del proyecto de grado «Estrategia de gamificación para el aprendizaje de cálculo diferencial aplicado a funciones de variable real en estudiantes del programa de Ingeniería de Sistemas de la Universidad Mariana» (Pasto, 2026).

- **Plataforma en producción:** https://calculus-quest-nine.vercel.app
- **Usuarios:** estudiantes del curso de Cálculo Diferencial y su docente.

## Qué incluye

- 14 misiones de dificultad creciente en general, agrupadas en cuatro bloques temáticos y con desbloqueo secuencial.
- 13 minijuegos, uno por misión individual, y una misión cooperativa por turnos (Escape Room) con sala compartida.
- Puntos de experiencia (XP) con bono por rapidez, niveles cada 500 XP, 8 insignias, avatar con piezas coleccionables y tabla de clasificación.
- Retroalimentación inmediata, ayuda en cada misión y sugerencia de repaso.
- Roles de estudiante, docente y administrador; panel docente con analítica por estudiante y por misión, exportación a CSV y chat.
- Encuesta de usabilidad System Usability Scale (SUS) integrada.

## Tecnologías

- **Interfaz:** React 18, Vite y Tailwind CSS.
- **Servidor:** 12 funciones serverless en Vercel (carpeta `api/`).
- **Base de datos:** PostgreSQL administrada en Neon.
- **Seguridad:** contraseñas cifradas con bcrypt, sesión con token JWT en una cookie HttpOnly, roles revalidados en el servidor, límite de intentos fallidos, y corrección de respuestas y desbloqueo de misiones calculados en el servidor.

## Ejecutar en local

```bash
npm install
cp .env.example .env   # completar DATABASE_URL y JWT_SECRET
npx vercel dev         # interfaz y funciones de api/
```

`npm run dev` levanta solo la interfaz, sin las funciones del servidor.

## Evaluación y privacidad

Para la revisión del proyecto se habilitaron dos cuentas de evaluación, una de estudiante y otra de docente. Sus credenciales se entregan con los soportes del informe y no se publican en este repositorio. Estas cuentas muestran los nombres de los estudiantes de forma parcial y no pueden modificar las cuentas reales.

El repositorio no contiene datos de los estudiantes. Los datos anonimizados del estudio se entregan como anexos del informe.
