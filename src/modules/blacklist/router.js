import * as add from "./commands/add.js";
import * as history from "./commands/history.js";
import * as edit from "./commands/edit.js";
import * as remove from "./commands/remove.js";
import * as case_ from "./commands/case.js";
import * as setblacklistchannel from "./commands/setblacklistchannel.js";

export const blacklistHandlers = {
  "setblacklistchannel": setblacklistchannel.handle,
  "blacklist": async (itx) => {
    const subcommand = itx.options.getSubcommand();
    if (subcommand === "add") return add.handle(itx);
    if (subcommand === "history") return history.handle(itx);
    if (subcommand === "edit") return edit.handle(itx);
    if (subcommand === "remove") return remove.handle(itx);
    if (subcommand === "case") return case_.handle(itx);
  }
};

