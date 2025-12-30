import { startAvatarScheduler } from "../utils/avatarManager.js";

let avatarInterval = null;

export default function ready(client) {
  console.log(`✅ Logueado como ${client.user.tag}`);
  
  avatarInterval = startAvatarScheduler(client);
}
