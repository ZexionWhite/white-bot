import * as userinfo from "./commands/userinfo.js";

export const infoHandlers = {
  user: userinfo.handle
};

export const infoComponentHandlers = {
  user: userinfo.handleSelectMenu
};
