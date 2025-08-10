# White-Bot — Discord.js v14 + SQLite

A lean, production-ready Discord bot for **Welcome messages**, **Color Autoroles**, and **Boost announcements**—with **per-user cooldown**, admin logs, and a small set of slash commands for configuration.

---

## ✨ Features

- **Welcome**
  - Clean embed: server title, the user’s name (no mention inside embed), avatar (thumbnail), a large GIF, and localized join time in the footer.
  - **Per-user cooldown** to avoid spam when someone joins/leaves repeatedly (persisted in SQLite).
  - Public welcome mention outside the embed for guaranteed notification.

- **Admin Logs**
  - Join log (always, no cooldown).
  - Leave log (recommended: enable `guildMemberRemove` event).

- **Color Autoroles**
  - Select menu with up to **25** options per menu (Discord limit).
  - **Toggle UX**: pick a color to apply; pick the same color again to remove it.
  - **Booster-only colors**: optional gate based on a server Booster role you configure.
  - Helper embed above the menu to explain how it works.

- **Boost Announcements**
  - Embed when a member **starts boosting** (with your GIF, join time, and current boost count in the footer).

- **Slash Commands**
  - Setup: `/setwelcome`, `/setlog`, `/setboosterrole`
  - Autoroles: `/setupcolors`, `/postautoroles`
  - Config: `/setwelcomecd`, `/setboostchannel`
  - Utilities: `/ping` (latency, uptime, memory), `/previewboost` (safe preview without boosting)

---

## 🧱 Tech Stack

- **Node.js** (ES Modules / `"type": "module"`)
- **discord.js v14**
- **better-sqlite3** (embedded SQLite, zero external services)

---

## ✅ Requirements

- **Node 18+** (LTS recommended).
- **Discord Application Settings**
  - **Scopes** for invite: `bot`, `applications.commands`
  - **Privileged Intents**: enable **Server Members Intent**.
  - (Optional) Message Content Intent is **not** required for this bot.
- **Bot Permissions** (minimum)
  - `Manage Roles`, `Send Messages`, `Embed Links`, `View Channels`, `Read Message History`
- **Role Hierarchy**
  - The bot’s highest role must sit **above** all color roles it will assign.

---

## 🗂 Project Structure

- src/
- commands/
- register-commands.js
- setupcolors.js
- postautoroles.js
# (optional) other command handlers you add
- events/
- ready.js
- guildMemberAdd.js
- guildMemberRemove.js # recommended
- guildMemberUpdate.js # boost announce
- interactionCreate.js
- utils/
- embeds.js
- config.js
- db.js
- index.js
- data/ # SQLite database lives here

---

## ⚙️ Configuration

Create `.env` (never commit it):

.env
BOT_TOKEN=your_token_here
CLIENT_ID=your_application_id_here
GUILD_ID_PRUEBA=your_test_guild_id   # optional, speeds up command propagation

package.json should include:

{
  "type": "module",
  "scripts": {
    "dev": "nodemon --watch src src/index.js",
    "register": "node src/commands/register-commands.js"
  }
}

src/config.js example:

export const TZ = "America/Argentina/Cordoba"; // IANA timezone for date formatting

// Welcome GIF
export const WELCOME_GIF_URL = "https://your.cdn/welcome.gif";

// Boost GIF (capybara-in-water or your choice)
export const BOOST_GIF_URL = "https://your.cdn/boost.gif";

Tip: Upload GIFs to a private channel in your server and use the Discord CDN URL for stability.

---

## 📦 Install & Setup

npm install
npm run register   # registers slash commands (guild-scoped if GUILD_ID_PRUEBA is set)
npm run dev        # start the bot in dev mode (nodemon)

# Then in your server (as an admin):

- /setwelcome #welcome-channel

- /setlog #admin-logs

- /setupcolors (creates/saves color roles)

- /postautoroles (posts/updates the color select menu)

- /setboosterrole @Boosters (if you use a custom booster role)

- /setwelcomecd 60 (example: 60 minutes)

- /setboostchannel #boosts (where boost announcements go)

---

## 🧠 How It Works
Welcome flow

On guildMemberAdd, bot logs the join (no cooldown).

The public welcome checks the cooldown (per user, persisted).

If not on cooldown, bot sends: mention (outside embed) + a clean embed (title, short hook, one helpful tip bullet, user avatar thumbnail, GIF, localized time).

Cooldown timestamp is saved in SQLite (cooldowns table) to prevent repeated welcomes.

Autoroles flow

- /setupcolors creates the color roles and stores them in color_roles.

- /postautoroles posts an embed + select menu (up to 25 options).

When a user picks a color:

If they already have it → toggle off (remove).

Otherwise → remove any other color from the palette and add the selected one.

Booster-only colors are enforced if configured.

Boost announce

On guildMemberUpdate, when premiumSince transitions from null → a date, the bot sends a boost embed to your configured channel with a GIF and current boost count.

## 🔧 Commands (Summary)
# Setup

- /setwelcome #channel — set the public welcome channel

- /setlog #channel — set the admin logs channel

- /setboosterrole @role — set the Booster role (for gated colors)

# Autoroles

- /setupcolors — create and store your default color roles

- /postautoroles — post/update the color select message (with helper embed)

# Config

- /setwelcomecd <minutes> — set per-user cooldown for the public welcome

- /setboostchannel #channel — set the boost announcement channel

# Utilities

- /ping — WS/API latency, round-trip, DB ping, uptime, memory

- /previewboost [usuario] [publico] [boosts] — preview the boost embed without real boosting

Note: Slash commands are registered via npm run register. If run with GUILD_ID_PRUEBA, they appear instantly on that guild; globally they can take up to ~1 hour.

## 🗃 Database Model (SQLite)
guild_settings(guild_id, welcome_channel_id, log_channel_id, autorole_channel_id, autorole_message_id, booster_role_id, booster_announce_channel_id, welcome_cd_minutes)

color_roles(guild_id, role_id, name, hex, booster_only)

cooldowns(guild_id, user_id, event, last_ts) — used for the welcome cooldown

Migrations are idempotent; the db.js helper ensures columns exist even if you update the bot later.

## 🧪 Testing Tips
Welcome cooldown: join/leave under the cooldown → no new welcome; after cooldown → welcome appears.

Autoroles

Pick a color → applies.

Pick the same color → removes (toggle off).

Try a 💎 Booster-only color without Booster role → blocked.

Boost announce: use /previewboost to see the exact embed without actually boosting.

Ping: /ping should show reasonable WS ping and DB ping values; uptime should increase over time.

## 🛟 Troubleshooting
No color applied/removed

Ensure the bot’s role is above all color roles.

The select menu can’t exceed 25 options (Discord limit); split into multiple menus/messages if needed.

No welcome message

Check Server Members Intent is enabled.

Confirm the configured welcome channel exists and the bot can Send Messages and Embed Links.

If a membership screening is enabled, you may want to wait for member.pending === false before sending.

No boost announcements

Set the boost channel with /setboostchannel.

Ensure the bot can send embeds in that channel.

Database errors

Make sure you use the provided db.js (schema & prepares happen in order).

In dev, you can delete data/bot.db to regenerate a clean DB.
