import * as warn from "./commands/warn.js";
import * as mute from "./commands/mute.js";
import * as unmute from "./commands/unmute.js";
import * as timeout from "./commands/timeout.js";
import * as untimeout from "./commands/untimeout.js";
import * as kick from "./commands/kick.js";
import * as ban from "./commands/ban.js";
import * as tempban from "./commands/tempban.js";
import * as softban from "./commands/softban.js";
import * as unban from "./commands/unban.js";
import * as history from "./commands/history.js";
import * as case_ from "./commands/case.js";
import * as editcase from "./commands/editcase.js";
import * as remove from "./commands/remove.js";
import * as clear from "./commands/clear.js";
import * as lock from "./commands/lock.js";
import * as unlock from "./commands/unlock.js";
import * as slowmode from "./commands/slowmode.js";
import * as createmuterole from "./commands/createmuterole.js";
import * as setmuterole from "./commands/setmuterole.js";
import * as setmodlog from "./commands/setmodlog.js";

export const moderationHandlers = {
  warn: warn.handle,
  mute: mute.handle,
  unmute: unmute.handle,
  timeout: timeout.handle,
  untimeout: untimeout.handle,
  kick: kick.handle,
  ban: ban.handle,
  tempban: tempban.handle,
  softban: softban.handle,
  unban: unban.handle,
  history: history.handle,
  case: case_.handle,
  editcase: editcase.handle,
  remove: remove.handle,
  clear: clear.handle,
  lock: lock.handle,
  unlock: unlock.handle,
  slowmode: slowmode.handle,
  createmuterole: createmuterole.handle,
  setmuterole: setmuterole.handle,
  setmodlog: setmodlog.handle,
  "voice-mod": async (itx) => {
    // voice-mod necesita client, lo obtenemos desde itx.client
    const { handleVoiceMod } = await import("./index.js");
    return handleVoiceMod(itx.client, itx);
  }
};

