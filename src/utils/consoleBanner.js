import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getVersion() {
  try {
    const packagePath = join(__dirname, "../../package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
    return packageJson.version || "unknown";
  } catch (error) {
    return "unknown";
  }
}

export function showBanner() {
  const version = getVersion();
  console.clear();
  console.log(`
 ██████╗  █████╗  ██████╗ ██╗   ██╗ ██████╗  ██████╗ ████████╗
██╔════╝ ██╔══██╗ ██╔══██╗╚██╗ ██╔╝ ██╔══██╗██╔═══██╗╚══██╔══╝
██║      ███████║ ██████╔╝ ╚████╔╝  ██████╔╝██║   ██║   ██║   
██║      ██╔══██║ ██╔═══╝   ╚██╔╝   ██╔══██╗██║   ██║   ██║   
╚██████╗ ██║  ██║ ██║        ██║    ██████╔╝╚██████╔╝   ██║   
 ╚═════╝ ╚═╝  ╚═╝ ╚═╝        ╚═╝    ╚═════╝  ╚═════╝    ╚═╝   

             Moderation & Voice — keep it chill

                    Version ${version}
               © 2025 White Studio · CapyBot
`);
}
