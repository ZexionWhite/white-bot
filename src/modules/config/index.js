/**
 * @deprecated Este módulo está deprecado. Usa src/modules/settings/ en su lugar.
 * Este archivo se mantiene temporalmente para compatibilidad hacia atrás.
 * Se eliminará en la próxima versión.
 */

// Re-exportar handlers desde settings para compatibilidad hacia atrás
export { handle as handleSetWelcome } from "../settings/commands/welcome.js";
export { handle as handleSetJoinLog } from "../settings/commands/join-log.js";
export { handle as handleSetMessageLog } from "../settings/commands/message-log.js";
export { handle as handleSetAvatarLog } from "../settings/commands/avatar-log.js";
export { handle as handleSetNicknameLog } from "../settings/commands/nickname-log.js";
export { handle as handleSetVoiceLog } from "../settings/commands/voice-log.js";
export { handle as handleSetBoostChannel } from "../settings/commands/boost-channel.js";
export { handle as handleSetInfoChannel } from "../settings/commands/info-channel.js";
export { handle as handleSetBoosterRole } from "../settings/commands/booster-role.js";
