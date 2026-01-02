import * as welcome from "./commands/welcome.js";
import * as joinLog from "./commands/join-log.js";
import * as messageLog from "./commands/message-log.js";
import * as avatarLog from "./commands/avatar-log.js";
import * as nicknameLog from "./commands/nickname-log.js";
import * as voiceLog from "./commands/voice-log.js";
import * as boostChannel from "./commands/boost-channel.js";
import * as infoChannel from "./commands/info-channel.js";
import * as boosterRole from "./commands/booster-role.js";
import * as prefix from "./commands/prefix.js";

export const settingsHandlers = {
  set: async (itx) => {
    const subcommand = itx.options.getSubcommand();
    
    if (subcommand === "welcome") return welcome.handle(itx);
    if (subcommand === "join-log") return joinLog.handle(itx);
    if (subcommand === "message-log") return messageLog.handle(itx);
    if (subcommand === "avatar-log") return avatarLog.handle(itx);
    if (subcommand === "nickname-log") return nicknameLog.handle(itx);
    if (subcommand === "voice-log") return voiceLog.handle(itx);
    if (subcommand === "boost-channel") return boostChannel.handle(itx);
    if (subcommand === "info-channel") return infoChannel.handle(itx);
    if (subcommand === "booster-role") return boosterRole.handle(itx);
    if (subcommand === "prefix") return prefix.handle(itx);
    
    return itx.reply({ content: "Subcomando no reconocido.", ephemeral: true });
  }
};
