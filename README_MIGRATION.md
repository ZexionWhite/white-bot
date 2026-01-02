# Migración a PostgreSQL - Estado Actual

## ✅ Completado

1. **Driver PostgreSQL implementado** (`src/core/db/postgres-adapter.js`)
   - Pool de conexiones configurado
   - Conversión automática de parámetros (? → $1, @param → $1, etc)
   - Compatible con la interfaz DatabaseDriver

2. **Configuración de entorno**
   - `DATABASE_URL` para PostgreSQL
   - `DB_PROVIDER` para seleccionar driver (sqlite/postgres)
   - Auto-detección si DATABASE_URL está presente

3. **Scripts de migración**
   - `scripts/migrate-schema.js` - Migra esquema SQLite → PostgreSQL
   - `scripts/export-sqlite.js` - Exporta datos de SQLite a JSON
   - `scripts/import-postgres.js` - Importa datos JSON a PostgreSQL
   - `scripts/validate-migration.js` - Valida migración comparando ambos

4. **Esquema PostgreSQL** (`migrations/001_initial_schema.sql`)
   - Todas las tablas convertidas
   - Tipos de datos ajustados (BIGINT, BIGSERIAL, etc)
   - Índices creados

5. **Documentación**
   - `MIGRATION_GUIDE.md` - Guía completa de migración
   - `README_MIGRATION.md` - Este archivo

## ⚠️ Ajustes Necesarios

### Queries que Usan Sintaxis SQLite Específica

Algunas queries necesitan conversión manual porque usan sintaxis específica de SQLite:

1. **`INSERT OR REPLACE`** en:
   - `src/db.js` - `insertColorRole` (línea ~211)
   - Necesita convertirse a `INSERT ... ON CONFLICT DO UPDATE`

2. **Verificar otros repositorios:**
   - Revisar todos los `.repo.js` para queries SQLite específicas

### Repositorios que Funcionan Directamente

Gracias a la abstracción de FASE 1, estos repositorios deberían funcionar sin cambios:
- ✅ `cases.repo.js` - Solo usa parámetros posicionales (?)
- ✅ `blacklist.repo.js` - Solo usa parámetros posicionales
- ✅ `messages.repo.js` - Solo usa parámetros posicionales
- ✅ `policy.repo.js` - Solo usa parámetros posicionales
- ✅ `voice.repo.js` - Solo usa parámetros posicionales

## Próximos Pasos

1. **Ajustar `insertColorRole` en `src/db.js`:**
   ```javascript
   // Actual (SQLite):
   INSERT OR REPLACE INTO color_roles (guild_id, role_id, name, hex, booster_only)
   VALUES (?, ?, ?, ?, ?);
   
   // PostgreSQL:
   INSERT INTO color_roles (guild_id, role_id, name, hex, booster_only)
   VALUES ($1, $2, $3, $4, $5)
   ON CONFLICT (guild_id, role_id) DO UPDATE SET
     name = EXCLUDED.name,
     hex = EXCLUDED.hex,
     booster_only = EXCLUDED.booster_only;
   ```

2. **Testing en desarrollo:**
   - Configurar PostgreSQL en Dokploy (dev)
   - Ejecutar migración de esquema
   - Exportar/importar datos
   - Probar funcionalidad

3. **Testing en producción:**
   - Después de validar en dev
   - Backup completo de SQLite
   - Migrar datos
   - Monitorear errores

## Notas Técnicas

### Conversión Automática de Parámetros

El `PostgresDriver` convierte automáticamente:
- `?` → `$1, $2, $3, ...`
- `@param` → `$1, $2, $3, ...` (en orden de aparición)

Esto significa que queries como:
```sql
SELECT * FROM table WHERE id = ? AND name = ?
INSERT INTO table (@guild_id, @channel_id) VALUES (@guild_id, @channel_id)
```

Funcionan sin cambios en el código.

### Transacciones

PostgreSQL maneja transacciones de forma diferente a SQLite:
- SQLite: `db.transaction(callback)` es síncrono
- PostgreSQL: `driver.transaction(callback)` es async

El wrapper en `PostgresDriver` ya maneja esto correctamente.

### Exec vs Query

- `exec()`: Para DDL (CREATE TABLE, etc) - ya es async en PostgreSQL
- `prepare().run/get/all()`: Para DML - async en PostgreSQL

El código actual en `db.js` llama a `exec()` de forma síncrona, pero el wrapper lo maneja.

## Comandos Rápidos

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env con DATABASE_URL

# 3. Migrar esquema
node scripts/migrate-schema.js

# 4. Exportar datos de SQLite
node scripts/export-sqlite.js

# 5. Importar a PostgreSQL
node scripts/import-postgres.js data/export/export.json

# 6. Validar
node scripts/validate-migration.js
```
