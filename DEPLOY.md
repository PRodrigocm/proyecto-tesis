# 🚀 Guía de Despliegue - Supabase + Netlify

## Paso 1: Configurar Supabase (Base de Datos)

### 1.1 Crear proyecto en Supabase
1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta
2. Click en **"New Project"**
3. Configura:
   - **Name**: `proyecto-tesis` (o el nombre que prefieras)
   - **Database Password**: Genera una contraseña segura (¡guárdala!)
   - **Region**: Selecciona la más cercana (ej: `South America (São Paulo)`)
4. Click en **"Create new project"** y espera ~2 minutos

### 1.2 Obtener la URL de conexión
1. En tu proyecto de Supabase, ve a **Settings** > **Database**
2. Busca la sección **"Connection string"**
3. Selecciona **"URI"** y copia la URL
4. Reemplaza `[YOUR-PASSWORD]` con tu contraseña de la base de datos

La URL se verá así:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 1.3 Migrar la base de datos

En tu terminal local, ejecuta:

```bash
# 1. Actualiza tu .env con la nueva DATABASE_URL de Supabase
# Edita el archivo .env y cambia DATABASE_URL

# 2. Genera el cliente de Prisma
npm run prisma:generate

# 3. Aplica las migraciones a Supabase
npx prisma migrate deploy

# 4. (Opcional) Ejecuta el seed para datos iniciales
npm run prisma:seed
```

---

## Paso 2: Configurar Netlify (Hosting)

### 2.1 Conectar repositorio
1. Ve a [https://netlify.com](https://netlify.com) y crea una cuenta
2. Click en **"Add new site"** > **"Import an existing project"**
3. Selecciona **GitHub** y autoriza el acceso
4. Busca y selecciona tu repositorio `proyecto-tesis`

### 2.2 Configurar el build
Netlify debería detectar automáticamente la configuración, pero verifica:
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: `20`

### 2.3 Configurar variables de entorno
En Netlify, ve a **Site settings** > **Environment variables** y agrega:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Tu URL de Supabase (del paso 1.2) |
| `JWT_SECRET` | Una clave secreta de 32+ caracteres |
| `NEXT_PUBLIC_APP_URL` | `https://tu-sitio.netlify.app` |
| `RESEND_API_KEY` | (Opcional) Tu API key de Resend |
| `TWILIO_ACCOUNT_SID` | (Opcional) Tu SID de Twilio |
| `TWILIO_AUTH_TOKEN` | (Opcional) Tu token de Twilio |
| `TWILIO_PHONE_NUMBER` | (Opcional) Tu número de Twilio |

### 2.4 Desplegar
1. Click en **"Deploy site"**
2. Espera a que termine el build (~3-5 minutos)
3. ¡Tu app estará disponible en la URL de Netlify!

---

## Paso 3: Verificación post-despliegue

### 3.1 Verificar la conexión a la base de datos
1. Abre tu app en Netlify
2. Intenta hacer login
3. Verifica que los datos se carguen correctamente

### 3.2 Verificar las API routes
Prueba estas URLs (reemplaza con tu dominio):
- `https://tu-sitio.netlify.app/api/health` (si existe)
- `https://tu-sitio.netlify.app/login`

---

## 🔧 Solución de problemas comunes

### Error: "Can't reach database server"
- Verifica que la `DATABASE_URL` sea correcta
- Asegúrate de usar el puerto `6543` (pooler) en producción
- Verifica que la IP de Netlify no esté bloqueada en Supabase

### Error: "Prisma Client not generated"
Agrega este script de build en `package.json`:
```json
"build": "prisma generate && next build"
```

### Error: "Module not found: bcrypt"
Ya está configurado en `next.config.ts` con `serverComponentsExternalPackages`

---

## 📝 Comandos útiles

```bash
# Ver logs de Prisma
npx prisma migrate status

# Abrir Prisma Studio (para ver/editar datos)
npx prisma studio

# Resetear la base de datos (¡CUIDADO! Borra todos los datos)
npx prisma migrate reset
```

---

## 🔐 Seguridad

- ✅ Nunca subas el archivo `.env` a GitHub
- ✅ Usa contraseñas seguras para la base de datos
- ✅ Genera un `JWT_SECRET` único y largo
- ✅ Configura las variables de entorno solo en Netlify
