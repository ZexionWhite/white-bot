# Capybot — Discord.js v14 + SQLite

A feature-rich, production-ready Discord bot built with **Discord.js v14** and **SQLite**. Capybot provides comprehensive server management tools including welcome messages, color autoroles, boost announcements, comprehensive logging, voice moderation, and user statistics tracking.

---

## ✨ Features

### 🎉 Welcome System
- **Customizable welcome embeds** with server branding, user avatars, and animated GIFs
- **Per-user cooldown system** to prevent spam when members join/leave repeatedly
- **Public welcome mentions** outside the embed for guaranteed notifications
- **Localized timestamps** using configurable timezone settings
- **Admin join logs** (separate from public welcomes, no cooldown)

### 🎨 Color Autoroles
- **Interactive select menu** with up to 25 color options per menu (Discord limit)
- **Toggle-based UX**: select a color to apply it; select the same color again to remove it
- **Automatic role management**: selecting a new color removes previous color roles
- **Booster-only colors**: optional gating based on server Booster role
- **Helper embed** explaining how the system works

### 💎 Boost Announcements
- **Automatic boost detection** when members start boosting
- **Rich embeds** with custom GIFs, boost count, and localized timestamps
- **Configurable announcement channel**
- **Preview command** to test embeds without actual boosting

### 📝 Comprehensive Logging System

#### Message Logs
- **Message deletion tracking** with content, attachments, and deleter information
- **Message edit tracking** with before/after content comparison
- **Audit log integration** to identify who deleted messages
- **Attachment tracking** for deleted/edited messages

#### Avatar Logs
- **Global avatar changes** (user profile picture updates)
- **Server avatar changes** (guild-specific avatar updates)
- **Before/after image composition** showing side-by-side comparison
- **Direct links** to both avatar versions

#### Nickname Logs
- **Nickname change tracking** with before/after values
- **Audit log integration** to identify who changed nicknames
- **User and executor information**

#### Voice State Logs
- **Join/leave/move tracking** for voice channels
- **Time tracking**: calculates and displays how long users spent in channels
- **Rich embeds** with channel information, user details, and timestamps
- **Bot filtering** to keep logs clean

### 📊 User Statistics
- **Voice time tracking**: accumulated time spent in voice channels per server
- **Message counting**: total messages sent in the server
- **User stats command**: display statistics with formatted duration and counts
- **Per-server tracking**: statistics are tracked independently per guild

### 🎤 Voice Moderation
- **Real-time voice channel moderation** with live embed updates
- **Two moderation modes**:
  - `/mod voicechat [channel]`: Moderate all users in a voice channel
  - `/mod voiceuser [user]`: Moderate a specific user in voice
- **Visual status indicators**:
  - Server mute/deafen (guild-applied)
  - Self mute/deafen (user-applied)
  - Unmuted/undeafened states
- **Interactive controls**:
  - Move yourself to the channel
  - Bring users to your channel
  - Mute/unmute individual users (toggle)
  - Mute/unmute all non-moderators
  - Manual refresh button
- **Auto-updating embeds**: automatically refreshes when users join/leave or change mute/deafen status
- **Moderator identification**: special icons for staff and server owners
- **Permission-based access**: requires `MuteMembers` or `MoveMembers` permissions

### 🛠️ Utility Commands
- **`/help`**: Comprehensive command list with descriptions
- **`/config`**: View current server configuration (moderator-only)
- **`/ping`**: Bot latency, API ping, database ping, uptime, and memory usage
- **`/preview`**: Preview embeds (boost, welcome) before they're sent
- **`/userstats`**: View user statistics (voice time, message count)

---

## 🧱 Tech Stack

- **Node.js** (ES Modules / `"type": "module"`)
- **discord.js v14** — Modern Discord API wrapper
- **better-sqlite3** — Embedded SQLite database (zero external services)
- **sharp** — Image processing for avatar before/after compositions
- **dotenv** — Environment variable management

---

## ✅ Requirements

- **Node.js 18+** (LTS recommended)
- **Discord Application Settings**:
  - **Scopes** for invite: `bot`, `applications.commands`
  - **Privileged Intents**: 
    - ✅ **Server Members Intent** (required)
    - ✅ **Message Content Intent** (required for message logging)
    - ✅ **Guild Voice States Intent** (required for voice moderation)
- **Bot Permissions** (minimum):
  - `Manage Roles` (for autoroles)
  - `Send Messages`
  - `Embed Links`
  - `View Channels`
  - `Read Message History`
  - `Mute Members` (for voice moderation)
  - `Move Members` (for voice moderation)
  - `View Audit Log` (for enhanced logging)
- **Role Hierarchy**:
  - The bot's highest role must be **above** all color roles it will assign
  - The bot's role must be **above** users it needs to mute/move in voice channels

---

## 🗂️ Project Structure

```
src/
├── commands/
│   ├── register-commands.js    # Slash command registration
│   ├── setupcolors.js          # Color role setup handler
│   ├── postautoroles.js        # Autorole menu posting
│   └── cleanup-commands.js     # Command cleanup utility
├── events/
│   ├── ready.js                # Bot ready event
│   ├── guildMemberAdd.js       # Welcome & join logs
│   ├── guildMemberRemove.js    # Leave logs
│   ├── guildMemberUpdate.js    # Boost & server avatar/nickname logs
│   ├── userUpdate.js           # Global avatar logs
│   ├── messageCreate.js        # Message counting
│   ├── messageUpdate.js        # Message edit logs
│   ├── messageDelete.js        # Message delete logs
│   ├── voiceStateUpdate.js     # Voice logs & time tracking
│   └── interactionCreate.js    # Slash command handler
├── utils/
│   ├── embeds.js               # Embed builders
│   ├── voiceMod.js             # Voice moderation utilities
│   ├── beforeAfter.js          # Avatar composition utility
│   ├── time.js                 # Time formatting utilities
│   └── colors.js               # Color utilities
├── config.js                   # Configuration (timezone, GIFs)
├── db.js                       # Database schema & prepared statements
└── index.js                    # Bot entry point
data/
└── bot.db                      # SQLite database (auto-created)
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file (never commit it):

```env
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
GUILD_ID_PRUEBA=your_test_guild_id  # Optional: speeds up command registration
```

### Bot Configuration

Edit `src/config.js`:

```javascript
export const TZ = "America/Argentina/Cordoba"; // IANA timezone for date formatting

// Welcome GIF URL
export const WELCOME_GIF_URL = "https://your.cdn/welcome.gif";

// Boost GIF URL
export const BOOST_GIF_URL = "https://your.cdn/boost.gif";
```

**Tip**: Upload GIFs to a private channel in your server and use the Discord CDN URL for stability.

### Package.json

Ensure your `package.json` includes:

```json
{
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node src/index.js",
    "register": "node src/commands/register-commands.js",
    "clean:guild": "node src/commands/cleanup-commands.js guild",
    "clean:global": "node src/commands/cleanup-commands.js global",
    "clean:both": "node src/commands/cleanup-commands.js"
  }
}
```

---

## 📦 Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Register slash commands**:
   ```bash
   npm run register
   ```
   - If `GUILD_ID_PRUEBA` is set, commands appear instantly on that guild
   - Global commands can take up to ~1 hour to propagate

3. **Start the bot**:
   ```bash
   npm start
   # or for development:
   npm run dev
   ```

4. **Configure your server** (as an admin):

   **Basic Setup**:
   ```
   /setwelcome #welcome-channel
   /setlog #admin-logs
   ```

   **Color Autoroles**:
   ```
   /setupcolors
   /postautoroles
   ```

   **Boost System**:
   ```
   /setboosterrole @Boosters  (if using custom booster role)
   /setboostchannel #boosts
   /setinfochannel #server-info  (optional, for boost embed)
   ```

   **Logging**:
   ```
   /setmessagelog #message-logs
   /setavatarlog #avatar-logs
   /setnicklog #nickname-logs
   /setvoicelog #voice-logs
   ```

   **Advanced**:
   ```
   /setwelcomecd 60  (cooldown in minutes)
   ```

---

## 🧠 How It Works

### Welcome Flow

1. On `guildMemberAdd`, the bot logs the join (admin log, no cooldown)
2. The public welcome checks the per-user cooldown (persisted in SQLite)
3. If not on cooldown, bot sends:
   - Public mention (outside embed)
   - Rich embed with server title, user avatar, GIF, and localized timestamp
4. Cooldown timestamp is saved to prevent repeated welcomes

### Autoroles Flow

1. `/setupcolors` creates color roles and stores them in the database
2. `/postautoroles` posts an embed + select menu (up to 25 options)
3. When a user selects a color:
   - If they already have it → toggle off (remove)
   - Otherwise → remove any other color from the palette and add the selected one
4. Booster-only colors are enforced if configured

### Boost Announcement Flow

1. On `guildMemberUpdate`, when `premiumSince` transitions from `null` → a date
2. Bot sends a boost embed to the configured channel
3. Embed includes custom GIF, boost count, and localized timestamp

### Logging Flow

- **Message logs**: Track edits and deletions with before/after content
- **Avatar logs**: Detect global and server avatar changes, compose before/after images
- **Nickname logs**: Track nickname changes with audit log integration
- **Voice logs**: Track join/leave/move events, calculate time spent in channels

### Voice Moderation Flow

1. Moderator uses `/mod voicechat` or `/mod voiceuser`
2. Bot creates an interactive embed showing all users in the channel
3. Embed displays real-time mute/deafen status (server vs self)
4. Actions update the embed automatically
5. Embed refreshes when users join/leave or change voice states

### Statistics Tracking

- **Voice time**: Tracked when users join/leave voice channels, accumulated per server
- **Message count**: Incremented for each non-bot message sent
- Statistics are stored per guild and user, accessible via `/userstats`

---

## 🔧 Commands Reference

### Setup Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/setwelcome #channel` | Set the public welcome channel | Manage Guild |
| `/setlog #channel` | Set the admin logs channel | Manage Guild |
| `/setwelcomecd <minutes>` | Set per-user cooldown for welcome messages | Manage Guild |

### Autorole Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/setupcolors` | Create and store default color roles | Manage Roles |
| `/postautoroles` | Post/update the color select menu | Manage Roles |

### Boost Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/setboosterrole @role` | Set the Booster role (for gated colors) | Manage Roles |
| `/setboostchannel #channel` | Set the boost announcement channel | Manage Guild |
| `/setinfochannel #channel` | Set the info/perks channel (for boost embed) | Manage Guild |
| `/preview boost` | Preview the boost embed without boosting | Manage Guild |
| `/preview welcome` | Preview the welcome embed | Manage Guild |

### Logging Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/setmessagelog #channel` | Set channel for message edit/delete logs | Manage Guild |
| `/setavatarlog #channel` | Set channel for avatar change logs | Manage Guild |
| `/setnicklog #channel` | Set channel for nickname change logs | Manage Guild |
| `/setvoicelog #channel` | Set channel for voice state logs | Manage Guild |

### Moderation Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/mod voicechat [channel]` | Moderate users in a voice channel | Mute Members / Move Members |
| `/mod voiceuser [user]` | Moderate a specific user in voice | Mute Members / Move Members |

### Utility Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/help` | Show all available commands | Everyone |
| `/config` | View current server configuration | Manage Guild |
| `/ping` | Show bot latency, uptime, and memory | Everyone |
| `/userstats [user]` | View user statistics (voice time, messages) | Everyone |

---

## 🗃️ Database Schema

### `guild_settings`
Stores per-guild configuration:
- `guild_id` (PRIMARY KEY)
- `welcome_channel_id`
- `log_channel_id`
- `autorole_channel_id`
- `autorole_message_id`
- `booster_role_id`
- `booster_announce_channel_id`
- `welcome_cd_minutes`
- `info_channel_id`
- `message_log_channel_id`
- `avatar_log_channel_id`
- `nickname_log_channel_id`
- `voice_log_channel_id`

### `color_roles`
Stores color role definitions:
- `guild_id`, `role_id` (PRIMARY KEY)
- `name`
- `hex`
- `booster_only` (INTEGER, 0 or 1)

### `cooldowns`
Tracks per-user cooldowns:
- `guild_id`, `user_id`, `event` (PRIMARY KEY)
- `last_ts` (timestamp)

### `voice_sessions`
Tracks active voice sessions for time calculation:
- `guild_id`, `user_id` (PRIMARY KEY)
- `channel_id`
- `join_timestamp`

### `user_stats`
Stores accumulated user statistics:
- `guild_id`, `user_id` (PRIMARY KEY)
- `total_voice_seconds` (accumulated voice time)
- `message_count` (total messages sent)

**Note**: Migrations are idempotent; the `db.js` helper ensures columns exist even if you update the bot later.

---

## 🧪 Testing Tips

### Welcome System
- Join/leave under the cooldown → no new welcome
- After cooldown expires → welcome appears
- Check admin logs for all joins (no cooldown)

### Autoroles
- Select a color → role applies
- Select the same color again → role removes (toggle)
- Try a 💎 Booster-only color without Booster role → blocked

### Boost Announcements
- Use `/preview boost` to see the exact embed without actually boosting
- Test with different boost counts

### Logging
- Edit a message → check message log channel
- Delete a message → check message log channel (includes deleter if available)
- Change avatar → check avatar log channel (before/after image)
- Change nickname → check nickname log channel
- Join/leave voice → check voice log channel (includes time spent)

### Voice Moderation
- Use `/mod voicechat` → see all users in channel
- Mute a user → embed updates automatically
- User joins/leaves → embed refreshes automatically
- Test with server mute vs self mute to see different icons

### Statistics
- Use `/userstats` to view accumulated voice time and message count
- Join voice channels to accumulate time
- Send messages to increment count

### Ping
- `/ping` should show reasonable WS ping and DB ping values
- Uptime should increase over time
- Memory usage should be stable

---

## 🛟 Troubleshooting

### No color applied/removed
- ✅ Ensure the bot's role is **above** all color roles in hierarchy
- ✅ The select menu can't exceed 25 options (Discord limit)
- ✅ Check bot has `Manage Roles` permission

### No welcome message
- ✅ Check **Server Members Intent** is enabled in Discord Developer Portal
- ✅ Confirm the configured welcome channel exists
- ✅ Verify bot has `Send Messages` and `Embed Links` permissions
- ✅ Check cooldown hasn't expired (use `/setwelcomecd` to adjust)

### No boost announcements
- ✅ Set the boost channel with `/setboostchannel`
- ✅ Ensure bot can send embeds in that channel
- ✅ Check boost actually occurred (not just preview)

### Logs not working
- ✅ Verify the log channel is configured correctly
- ✅ Check bot has `View Audit Log` permission (for enhanced logging)
- ✅ Ensure bot has `Read Message History` for message logs
- ✅ Check bot has `View Channels` permission

### Voice moderation not working
- ✅ Verify bot has `Mute Members` and/or `Move Members` permissions
- ✅ Check bot's role is above users it needs to moderate
- ✅ Ensure **Guild Voice States Intent** is enabled
- ✅ Try refreshing the embed manually

### Statistics not updating
- ✅ Voice time only tracks when users are in voice channels
- ✅ Message count only tracks non-bot messages
- ✅ Statistics are per-server (not global)

### Database errors
- ✅ Make sure you're using the provided `db.js` (schema & prepares happen in order)
- ✅ In development, you can delete `data/bot.db` to regenerate a clean database
- ✅ Ensure the `data/` directory is writable

---

## 📝 Notes

- All timestamps use the timezone configured in `src/config.js`
- Voice time tracking only counts time when users are actually in voice channels
- Message counting excludes bot messages and system messages
- Voice moderation embeds auto-update when voice states change
- Color autoroles automatically remove previous colors when selecting a new one
- Booster-only colors require the user to have the configured Booster role

---

## 🔄 Migration from White-Bot

If you're migrating from the previous "White-Bot" name:

1. **Repository**: You can simply rebrand this repository (rename, update README, etc.) or create a new one. For a clean slate, a new repository is recommended, but rebranding works fine too.

2. **Database**: The existing `data/bot.db` will continue to work - no migration needed.

3. **Configuration**: All existing settings will be preserved.

4. **Commands**: Slash commands will need to be re-registered if you change the bot's application name, but the command structure remains the same.

---

## 📄 License

This project is provided as-is for educational and personal use.

---

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

---

**Made with ❤️ using Discord.js v14**
