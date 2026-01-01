import * as modconfig from "./commands/modconfig.js";

export const permissionsHandlers = {
  modconfig: modconfig.handle
};

export const permissionsAutocompleteHandlers = {
  modconfig: modconfig.handleAutocomplete
};
