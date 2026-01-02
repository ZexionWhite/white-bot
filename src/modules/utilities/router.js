import * as preview from "./preview.js";
import * as ping from "./ping.js";
import * as help from "./help.js";
import * as config from "./config.js";

export const utilitiesHandlers = {
  preview: preview.default,
  ping: ping.default,
  help: async (itx) => {
    // help necesita client, lo obtenemos desde itx.client
    return help.default(itx, itx.client);
  },
  config: config.default
};

// Handlers para componentes de utilities (help, test)
export const utilitiesComponentHandlers = {
  "help": async (itx, customId) => {
    // help:close o help:select
    const action = customId.split(":")[1];
    if (action === "close") {
      const { handleHelpClose } = await import("./help/help.handler.js");
      return handleHelpClose(itx);
    }
    if (action === "select") {
      const { handleHelpSelect } = await import("./help/help.handler.js");
      return handleHelpSelect(itx, itx.client);
    }
  },
  "test": async (itx, customId) => {
    // test:select
    const action = customId.split(":")[1];
    if (action === "select") {
      const { handleTestSelect } = await import("./test/test.handler.js");
      return handleTestSelect(itx, itx.client);
    }
  }
};
