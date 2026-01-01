import { handleTestCommand } from "./test.handler.js";

export default async function handleTest(itx, client) {
  return handleTestCommand(itx, client);
}
