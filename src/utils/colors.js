export function hexToInt(hex) {
  return parseInt(hex.replace("#", ""), 16);
}

export function isBoosterRole(role) {
  return role?.tags?.premiumSubscriberRole === true;
}
