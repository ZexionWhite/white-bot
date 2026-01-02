# Guía de Migración: SQLite → PostgreSQL

Esta guía explica cómo migrar de SQLite a PostgreSQL en el bot Capybot.

## Requisitos Previos

1. **PostgreSQL configurado en Dokploy:**
   - Servicio `capy-postgres` creado
   - Base de datos `capybot` (producción) y/o `capybot_dev` (desarrollo)
   - Volumen/persistencia configurado
   - Credenciales disponibles

2. **Variables de entorno:**
   - `DATABASE_URL`: Connection string de PostgreSQL
   - `DB_PROVIDER`: `"sqlite"` (default) o `"postgres"`

## Paso 1: Instalar Dependencias

```bash
npm install pg
```

## Paso 2: Configurar Variables de Entorno

En Dokploy, agregar a las variables de entorno del deploy:

**Producción:**
```env
DATABASE_URL=postgresql://user:password@capy-postgres:5432/capybot
DB_PROVIDER=postgres
NODE_ENV=production
```

**Desarrollo:**
```env
DATABASE_URL=postgresql://user:password@capy-postgres:5432/capybot_dev
DB_PROVIDER=postgres
NODE_ENV=development
```

**Nota:** Si `DATABASE_URL` está presente, el bot usará PostgreSQL automáticamente, incluso sin `DB_PROVIDER=postgres`.

## Paso 3: Crear Esquema en PostgreSQL

Ejecutar el script de migración de esquema:

```bash
# Desarrollo (recomendado primero)
node scripts/migrate-schema.js

# Dry-run (ver qué se ejecutará sin hacer cambios)
node scripts/migrate-schema.js --dry-run
```

Este script:
- Lee `migrations/001_initial_schema.sql`
- Crea todas las tablas en PostgreSQL
- Crea índices necesarios
- Valida la conexión

## Paso 4: Exportar Datos de SQLite

Antes de migrar, hacer backup y exportar datos:

```bash
# Exportar datos de SQLite a JSON
node scripts/export-sqlite.js

# Los archivos se guardan en data/export/
# - export.json: datos exportados
# - summary.json: resumen de la exportación
# - backup_*.db: backup del SQLite original
```

## Paso 5: Importar Datos a PostgreSQL

**⚠️ IMPORTANTE: Probar primero en desarrollo (capybot_dev)**

```bash
# Importar datos a PostgreSQL
node scripts/import-postgres.js data/export/export.json

# Si quieres truncar tablas antes de importar (CUIDADO)
node scripts/import-postgres.js data/export/export.json --truncate
```

## Paso 6: Validar Migración

Comparar datos entre SQLite y PostgreSQL:

```bash
node scripts/validate-migration.js
```

Este script:
- Compara conteos de registros por tabla
- Valida integridad básica
- Muestra diferencias si las hay

## Paso 7: Actualizar Repositorios

Los repositorios ya están preparados para funcionar con PostgreSQL gracias a la abstracción de FASE 1. Sin embargo, algunas queries específicas de SQLite necesitan ajustes:

### Cambios Necesarios en Queries

1. **INSERT OR REPLACE:**
   ```sql
   -- SQLite
   INSERT OR REPLACE INTO table (col1, col2) VALUES (?, ?);
   
   -- PostgreSQL
   INSERT INTO table (col1, col2) VALUES ($1, $2)
   ON CONFLICT (primary_key_col) DO UPDATE SET col1 = EXCLUDED.col1, col2 = EXCLUDED.col2;
   ```

2. **Parámetros nombrados (@param):**
   - El adaptador PostgreSQL los convierte automáticamente a $1, $2, etc.
   - No requiere cambios en el código

3. **AUTOINCREMENT:**
   - Ya convertido a BIGSERIAL en el esquema
   - No requiere cambios en queries

### Repositorios que Necesitan Ajustes

Algunos repositorios usan sintaxis específica de SQLite:

- `src/db.js` - `insertColorRole` (INSERT OR REPLACE)
- Verificar otros repositorios para INSERT OR REPLACE

## Paso 8: Testing

### Testing en Desarrollo

1. **Probar funcionalidad básica:**
   - Bot inicia correctamente
   - Comandos funcionan
   - Eventos procesan correctamente

2. **Probar cada módulo:**
   - ✅ Moderation (casos, sanciones)
   - ✅ Blacklist
   - ✅ Settings
   - ✅ Autoroles
   - ✅ Permissions
   - ✅ Logs (message, voice, avatar, etc)

3. **Verificar performance:**
   - Queries no son más lentas
   - No hay timeouts
   - Pool de conexiones funciona correctamente

### Testing en Producción

1. **Migrar datos de producción:**
   ```bash
   # En el servidor de producción
   node scripts/export-sqlite.js
   node scripts/import-postgres.js data/export/export.json
   ```

2. **Actualizar variables de entorno en Dokploy**
3. **Reiniciar el bot**
4. **Monitorear logs para errores**

## Rollback Plan

Si necesitas volver a SQLite:

1. **Revertir variables de entorno:**
   ```env
   # Remover o comentar
   # DATABASE_URL=...
   DB_PROVIDER=sqlite
   ```

2. **Reiniciar el bot**
3. **El bot usará SQLite automáticamente**

**Nota:** Los datos en PostgreSQL se mantienen, pero el bot no los usará hasta que vuelvas a cambiar a PostgreSQL.

## Diferencias SQLite vs PostgreSQL

### Tipos de Datos

| SQLite | PostgreSQL |
|--------|-----------|
| TEXT | TEXT o VARCHAR |
| INTEGER | BIGINT |
| INTEGER PRIMARY KEY AUTOINCREMENT | BIGSERIAL PRIMARY KEY |
| Sin tipo booleano | BOOLEAN |

### Sintaxis

| SQLite | PostgreSQL |
|--------|-----------|
| `INSERT OR REPLACE` | `INSERT ... ON CONFLICT DO UPDATE` |
| `?` (parámetros) | `$1, $2, ...` |
| `PRAGMA table_info()` | `information_schema.columns` |

### Funcionalidades

- **Transacciones:** PostgreSQL requiere BEGIN/COMMIT explícitos (ya manejado en el driver)
- **Prepared Statements:** PostgreSQL los maneja automáticamente (wrapper implementado)
- **Connection Pooling:** PostgreSQL requiere pool (implementado con pg.Pool)

## Troubleshooting

### Error: "relation does not exist"

- Ejecutar `migrate-schema.js` primero
- Verificar que `DATABASE_URL` apunta a la DB correcta

### Error: "duplicate key value violates unique constraint"

- Datos ya existen (usar `--truncate` si quieres reemplazar)
- O usar `ON CONFLICT DO NOTHING` en imports

### Error: "syntax error at or near"

- Query con sintaxis SQLite específica
- Revisar logs para identificar la query
- Convertir manualmente o ajustar en el repositorio

### Performance lenta

- Verificar índices creados
- Ajustar pool size en `PostgresDriver` constructor
- Revisar queries lentas con `EXPLAIN ANALYZE`

## Próximos Pasos (FASE 3)

Después de migrar a PostgreSQL:
- Implementar Redis para cache
- Cache de `getSettings` (llamado frecuentemente)
- Cache de permisos
- Rate limiting mejorado

## Soporte

Si encuentras problemas durante la migración:
1. Revisar logs del bot
2. Verificar conexión a PostgreSQL (health check)
3. Validar datos con `validate-migration.js`
4. Revisar `ARCHITECTURE.md` para entender la estructura
