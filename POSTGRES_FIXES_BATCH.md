# Correcciones Batch para PostgreSQL

Este archivo lista TODAS las correcciones necesarias que faltan. Dado el volumen, se están haciendo por lotes.

## ✅ COMPLETADO

### Settings Commands (9 archivos)
- ✅ welcome.js
- ✅ join-log.js  
- ✅ message-log.js
- ✅ avatar-log.js
- ✅ nickname-log.js
- ✅ voice-log.js
- ✅ boost-channel.js
- ✅ info-channel.js
- ✅ booster-role.js
- ✅ prefix.js
- ✅ message-log-updated.js
- ✅ _updateAllSettings.js (getAllSettingsFields ahora es async)

### Utilities
- ✅ preview.js
- ✅ config.js
- ✅ ping.js (ya tenía await)

### Info
- ✅ userinfo.js

### Autoroles
- ✅ setup-colors.js
- ✅ color-menu.js (ya corregido anteriormente)
- ✅ router.js (ya corregido anteriormente)

## 🔴 PENDIENTE (Batch 1: Comandos de Moderation)

### Casos y Historial
- `src/modules/moderation/commands/case.js` - CasesService.getCase() → await
- `src/modules/moderation/commands/editcase.js` - CasesService.getCase() → await
- `src/modules/moderation/commands/history.js` - CasesService.countUserCases(), CasesService.getUserCases() → await
- `src/modules/moderation/commands/remove.js` - CasesService.getCase(), CasesService.deleteCase() → await
- `src/modules/moderation/commands/clear.js` - CasesService.createCase() → await

### Configuración de Mute
- `src/modules/moderation/commands/mute.js` - SettingsRepo.getGuildSettings() → await
- `src/modules/moderation/commands/unmute.js` - SettingsRepo.getGuildSettings() → await
- `src/modules/moderation/commands/setmuterole.js` - SettingsRepo.updateGuildSettings() → await
- `src/modules/moderation/commands/createmuterole.js` - SettingsRepo.updateGuildSettings() → await
- `src/modules/moderation/commands/setmodlog.js` - SettingsRepo.updateGuildSettings() → await

### Prefix Commands
- `src/modules/moderation/commands/prefix.js` - SettingsRepo.getGuildSettings() (líneas 110, 144) → await
- `src/modules/moderation/commands/prefix-extra.js` - CasesService.* y SettingsRepo.getGuildSettings() (líneas 70, 73, 94, 131, 134, 138, 147) → await

## 🔴 PENDIENTE (Batch 2: Comandos de Blacklist)

- `src/modules/blacklist/commands/edit.js` - BlacklistService.getEntry() → await
- `src/modules/blacklist/commands/history.js` - BlacklistService.getUserEntries() → await
- `src/modules/blacklist/commands/remove.js` - BlacklistService.getEntry(), BlacklistService.deleteEntry() → await
- `src/modules/blacklist/commands/setblacklistchannel.js` - SettingsRepo.updateGuildSettings() → await

## 🔴 PENDIENTE (Batch 3: Modals Handlers)

### Moderation Modals
- `src/modules/moderation/modals/handlers.js` - SettingsRepo.getGuildSettings() (múltiples), CasesService.getCase(), CasesService.updateCase() → await

### Blacklist Modals  
- `src/modules/blacklist/modals/handlers.js` - SettingsRepo.getGuildSettings(), BlacklistService.createEntry(), BlacklistService.getEntry(), BlacklistService.updateEntry() → await

## 🔴 PENDIENTE (Batch 4: Permissions Commands)

- `src/modules/permissions/commands/modconfig.js` - PolicyRepo.getAllPoliciesBySubject.all(), PolicyRepo.deletePolicy.run(), PolicyRepo.createPolicy.run(), PolicyRepo.deleteAllPolicies.run() → await
