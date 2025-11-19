# Proyecto Tesis – Plataforma de Gestión Escolar

Aplicación web construida con **Next.js 15**, **React 19** y **Prisma ORM** para administrar procesos escolares (asistencias, retiros, calendarios, docentes, apoderados y más). Este README explica cómo instalar, configurar y ejecutar el proyecto en un entorno local.

---

## 📋 Requisitos previos

Asegúrate de tener instalado lo siguiente:

- **Node.js** >= 18.x (recomendado 20.x LTS)
- **npm** >= 9.x (se instala junto a Node)
- **PostgreSQL** >= 13 (local o en la nube)
- **Git**

Opcional pero recomendado:

- **pnpm** o **yarn** si prefieres otro gestor de paquetes
- **Prisma CLI** (`npm install -g prisma`) para manejar migraciones manualmente

---

## 🚀 Instalación

1. **Clona el repositorio**

   ```bash
   git clone https://github.com/tu-usuario/proyecto-tesis.git
   cd proyecto-tesis
   ```

2. **Instala dependencias** (frontend + scripts internos)

   ```bash
   npm install
   ```

---

## 🔐 Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con al menos las siguientes variables:

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://usuario:password@localhost:5432/proyecto_tesis"

# JWT / Seguridad
JWT_SECRET="cambia-esta-clave-super-secreta"

# Correo / SMS (opcional según los módulos que utilices)
EMAIL_HOST="smtp.tu-proveedor.com"
EMAIL_PORT=587
EMAIL_USER="tu-correo"
EMAIL_PASS="tu-password"

# Twilio (opcional)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
```

> 📌 **Importante:** ajusta las variables a tu entorno real. Consulta el código en `src/app/api` para identificar otros valores que puedas necesitar (por ejemplo, llaves de Resend, QR, etc.).

---

## 🗃️ Base de datos y Prisma

1. **Generar cliente Prisma**
   ```bash
   npm run prisma:generate
   ```

2. **Ejecutar migraciones**
   ```bash
   npm run prisma:migrate
   ```

3. **Cargar datos iniciales (seed)**
   ```bash
   npm run prisma:seed
   ```

> Si necesitas datos de prueba adicionales, revisa los scripts en `prisma/` y `scripts/` (por ejemplo `seed-test-users`, `init:retiros-data`, etc.).

---

## 🧑‍💻 Comandos principales

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el frontend (Next.js) en modo desarrollo en `http://localhost:3000` |
| `npm run build` | Compila el proyecto para producción |
| `npm run start` | Levanta la versión compilada |
| `npm run dev:backend` | Ejecuta servicios backend adicionales (si aplica) |
| `npm run build:backend` / `npm run start:backend` | Compila y ejecuta scripts backend en `src/index.ts` |
| `npm run prisma:studio` | Abre Prisma Studio para explorar la base de datos |
| `npm run init:retiros-data` | Inicializa datos específicos para retiros |
| `npm run generate:qr-pdf` | Genera PDFs con códigos QR |

Consulta `package.json` para ver toda la lista de scripts disponibles y su propósito.

---

## 🧱 Estructura general del proyecto

```
proyecto-tesis/
├─ prisma/                # Esquema y seeds de la BD
├─ scripts/               # Utilidades (QR, seeds, fixes, etc.)
├─ src/
│  ├─ app/                # Rutas App Router de Next.js
│  │  ├─ api/             # Endpoints REST/Next API
│  │  └─ admin/, apoderado/, docente/, auxiliar/ ...
│  ├─ components/         # Componentes reutilizables
│  ├─ hooks/              # Hooks personalizados
│  ├─ lib/                # Configuraciones (Prisma, auth, etc.)
│  └─ styles/             # Estilos globales / Tailwind
├─ public/                # Assets estáticos
└─ README.md              # Este archivo
```

---

## 🧾 Flujos principales de la app

- **Panel Admin:** Gestión de usuarios (docentes, apoderados, administrativos), retiros, calendarios, reuniones, notificaciones.
- **Panel Docente:** Asistencias, clases, reportes, retiros.
- **Panel Apoderado:** Solicitud/aprobación de retiros, justificaciones, notificaciones.
- **Panel Auxiliar:** Control de asistencias, retiros, tolerancias.

Cada panel consume los endpoints alojados en `src/app/api/**` protegidos mediante JWT.

---

## 🛠️ Desarrollo local

1. Asegúrate de tener la BD corriendo y `.env` configurado.
2. Ejecuta migraciones/seed si aún no lo has hecho.
3. Inicia el servidor con `npm run dev`.
4. Accede a `http://localhost:3000`.
5. Loguéate con las credenciales de prueba (ver seeds o scripts de usuarios de prueba).

---

## 🚢 Despliegue

1. **Build de producción:**
   ```bash
   npm run build
   npm run start
   ```

2. Configura las variables de entorno en tu proveedor (Vercel, Railway, Render, etc.).
3. Asegúrate de que PostgreSQL sea accesible desde el entorno de prod.
4. Ejecuta `npm run prisma:migrate` y `npm run prisma:seed` (o el flujo equivalente) en el servidor de producción antes de iniciar la app.

---

## ✅ Checklist rápido

- [ ] Variables de entorno `.env` configuradas
- [ ] PostgreSQL corriendo y accesible
- [ ] `npm install`
- [ ] `npm run prisma:migrate`
- [ ] `npm run prisma:seed`
- [ ] `npm run dev`

---

## 📚 Recursos útiles

- [Documentación Next.js](https://nextjs.org/docs)
- [Documentación Prisma](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [JWT – jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)

---

## 🤝 Contribuciones

1. Haz un fork del repositorio.
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza los cambios y escribe pruebas si aplica.
4. Ejecuta `npm run build` para asegurarte de que todo funcione.
5. Abre un Pull Request describiendo los cambios.

---

## 📄 Licencia

Este proyecto forma parte de una tesis académica. Ajusta la licencia según tus necesidades (MIT, GPL, etc.) antes de hacerlo público si aún no lo has decidido.

---

¡Listo! Ya puedes ejecutar y extender la plataforma de gestión escolar. Si necesitas soporte adicional, revisa el código en `src/app/api` y los scripts en `scripts/` para entender los procesos automatizados (retiros, QR, correos, etc.).
