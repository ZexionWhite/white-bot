import { handleHelpCommand } from "./help/help.handler.js";

export default async function handleHelp(itx, client) {
  return handleHelpCommand(itx, client);
}

