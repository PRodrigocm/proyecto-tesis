# 🐳 Docker - Proyecto Tesis

Guía para ejecutar el proyecto usando Docker.

## Requisitos

- Docker Desktop instalado
- Docker Compose v2+

## Inicio Rápido

### 1. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp docker.env.example .env

# Editar .env con tus valores
```

### 2. Construir y ejecutar

```bash
# Construir las imágenes
docker-compose build

# Iniciar los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f app
```

### 3. Ejecutar migraciones (primera vez)

```bash
# Ejecutar migraciones y seed
docker-compose --profile migrate up migrate
```

## Comandos Útiles

### Gestión de contenedores

```bash
# Iniciar servicios
docker-compose up -d

# Detener servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f
docker-compose logs -f app
docker-compose logs -f db
```

### Base de datos

```bash
# Acceder a PostgreSQL
docker-compose exec db psql -U postgres -d proyecto_tesis

# Backup de la base de datos
docker-compose exec db pg_dump -U postgres proyecto_tesis > backup.sql

# Restaurar backup
docker-compose exec -T db psql -U postgres proyecto_tesis < backup.sql
```

### Prisma

```bash
# Ejecutar migraciones
docker-compose exec app npx prisma migrate deploy

# Generar cliente
docker-compose exec app npx prisma generate

# Seed de datos
docker-compose exec app npx prisma db seed

# Prisma Studio (requiere puerto adicional)
docker-compose exec app npx prisma studio
```

### Desarrollo

```bash
# Reconstruir imagen después de cambios
docker-compose build --no-cache app

# Reconstruir y reiniciar
docker-compose up -d --build app
```

## Estructura de Servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| `app` | 3000 | Aplicación Next.js |
| `db` | 5432 | PostgreSQL 15 |
| `migrate` | - | Migraciones (perfil) |

## Variables de Entorno

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `POSTGRES_USER` | Usuario PostgreSQL | ✅ |
| `POSTGRES_PASSWORD` | Contraseña PostgreSQL | ✅ |
| `POSTGRES_DB` | Nombre de la BD | ✅ |
| `JWT_SECRET` | Secret para JWT | ✅ |
| `NEXTAUTH_SECRET` | Secret para NextAuth | ✅ |
| `NEXTAUTH_URL` | URL de la aplicación | ✅ |
| `RESEND_API_KEY` | API Key de Resend | ❌ |
| `TWILIO_ACCOUNT_SID` | Account SID de Twilio | ❌ |
| `TWILIO_AUTH_TOKEN` | Auth Token de Twilio | ❌ |
| `TWILIO_PHONE_NUMBER` | Número de Twilio | ❌ |

## Producción

Para producción, asegúrate de:

1. **Cambiar todas las contraseñas y secrets**
2. **Usar HTTPS** (configurar reverse proxy como Nginx o Traefik)
3. **Configurar backups automáticos** de la base de datos
4. **Limitar recursos** de los contenedores
5. **Configurar logging** centralizado

### Ejemplo con Nginx (reverse proxy)

```yaml
# Agregar a docker-compose.yml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - ./certs:/etc/nginx/certs:ro
  depends_on:
    - app
```

## Troubleshooting

### Error: "Cannot connect to database"

```bash
# Verificar que la BD esté corriendo
docker-compose ps db

# Ver logs de la BD
docker-compose logs db

# Reiniciar la BD
docker-compose restart db
```

### Error: "Port already in use"

```bash
# Cambiar el puerto en docker-compose.yml
# O detener el servicio que usa el puerto
netstat -ano | findstr :3000
```

### Limpiar todo y empezar de nuevo

```bash
# Detener y eliminar contenedores, volúmenes y redes
docker-compose down -v

# Eliminar imágenes
docker-compose down --rmi all

# Reconstruir desde cero
docker-compose build --no-cache
docker-compose up -d
```
