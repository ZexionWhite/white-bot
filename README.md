# Capybot — Discord.js v14 + PostgreSQL + Redis

A feature-rich, production-ready Discord bot built with **Discord.js v14**, **PostgreSQL**, and **Redis**. Capybot provides comprehensive server management tools including welcome messages, color autoroles, boost announcements, comprehensive logging (via webhooks), voice moderation, **complete moderation system**, **blacklist management**, **user information tracking**, and user statistics tracking.

---

## ✨ Features

### 🛡️ Complete Moderation System
- **Comprehensive sanction system**: warn, mute, unmute, timeout, untimeout, kick, ban, tempban, softban, unban
- **Case management**: view, edit, delete, and track all moderation actions with full history
- **Automatic expiration**: temporary bans, mutes, and timeouts are automatically lifted when duration expires
- **Modlog integration**: all sanctions are logged to a dedicated channel with formatted embeds
- **DM notifications**: users receive direct messages about sanctions applied to them
- **Modal-based reasons**: all moderation commands use modals for collecting detailed reasons
- **Role hierarchy protection**: users cannot moderate others with equal or higher roles
- **Minimalist embed design**: clean, compact embeds for all moderation actions

### 🚫 Blacklist System
- **Persistent blacklist**: track problematic users with severity levels (LOW, MEDIUM, HIGH, CRITICAL)
- **Evidence support**: attach evidence (links, message IDs) to blacklist entries
- **Full history tracking**: view complete blacklist history for any user
- **Editable entries**: modify reason, evidence, and severity of existing entries
- **Separate from sanctions**: blacklist is independent from the moderation case system

### 👤 Advanced User Information
- **Comprehensive user profiles**: view detailed information about any user
- **Multi-view system**: Overview, Sanctions History, Blacklist History, Voice Activity, Recent Messages, Permissions/Overrides, Statistics
- **Trust score calculation**: 0-100 score based on recent sanctions and behavior
- **Permission overrides**: see all custom permission policies (module and command-level)
- **Activity tracking**: recent voice activity and message history
- **Statistics**: voice time and message count tracking

### 🔐 Advanced Permission System
- **Module-level permissions**: control access to entire modules (Moderation, Blacklist, Info, Config, Utilities)
- **Command-level permissions**: fine-grained control over individual commands
- **User and role-based policies**: apply permissions to specific users or roles
- **Discord native fallback**: uses Discord's native permissions when no custom policy exists
- **Easy configuration**: `/modconfig` command with intuitive subcommands for managing permissions

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

All logs use **Discord Webhooks** for improved performance and to eliminate rate limits, with automatic fallback to `channel.send()` if webhooks are unavailable.

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
  - `/voice-mod channel [channel]`: Moderate all users in a voice channel
  - `/voice-mod user [user]`: Moderate a specific user in voice
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
- **`/help`** / **`capy!help`**: Interactive help system with categorized command list
- **`/config`** / **`capy!config`**: View current server configuration (moderator-only)
- **`/ping`** / **`capy!ping`**: Bot latency, API ping, database ping, uptime, and memory usage
- **`/preview`**: Preview embeds (boost, welcome) before they're sent
- **`/user [user]`** / **`capy!user [user]`**: Comprehensive user information with multiple views

### 🔧 Prefix Commands

The bot supports both slash commands and prefix commands (using `capy!` prefix):

- **Moderation**: `warn`, `ban`, `kick`, `mute`, `timeout`, `tempban`, `history`, `case`, `clear`, `unban`
- **Utilities**: `ping`, `help`, `config`
- **Information**: `user`

Use `capy!help` to see all available prefix commands with descriptions and aliases.

---

## 🧱 Tech Stack

- **Node.js** (ES Modules / `"type": "module"`)
- **discord.js v14** — Modern Discord API wrapper
- **PostgreSQL** — Primary relational database (production)
- **Redis** — Cache and temporary state storage (optional, with fallback)
- **ioredis** — Redis client for Node.js
- **sharp** — Image processing for avatar before/after compositions
- **dotenv** — Environment variable management
- **Discord Webhooks** — High-performance logging system

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
  - `Manage Roles` (for autoroles and mute role)
  - `Manage Channels` (for lock/unlock/slowmode)
  - `Manage Messages` (for clear command)
  - `Moderate Members` (for warn, timeout, history, case commands)
  - `Kick Members` (for kick command)
  - `Ban Members` (for ban, tempban, softban, unban commands)
  - `Send Messages`
  - `Embed Links`
  - `View Channels`
  - `Read Message History`
  - `Mute Members` (for voice moderation and mute command)
  - `Move Members` (for voice moderation)
  - `View Audit Log` (for enhanced logging)
- **Role Hierarchy**:
  - The bot's highest role must be **above** all color roles it will assign
  - The bot's role must be **above** users it needs to mute/move in voice channels
  - The bot's role must be **above** the mute role for mute/unmute commands to work

---

## 🗂️ Project Structure

```
src/
├── core/                    # Core infrastructure
│   ├── commands/            # Command kernel (slash & prefix)
│   ├── config/              # Environment configuration
│   ├── db/                  # Database abstraction (PostgreSQL)
│   ├── redis/               # Redis client & helpers (cache, sessions, cooldowns)
│   ├── webhooks/            # Webhook management for logging
│   ├── logger/              # Unified logging system
│   └── errors/              # Error handling
├── modules/
│   ├── moderation/          # Moderation system
│   │   ├── commands/        # Slash & prefix command handlers
│   │   ├── services/        # Business logic
│   │   ├── db/              # Database repositories
│   │   ├── ui/              # Embeds and components
│   │   ├── modals/          # Modal handlers and helpers
│   │   └── slash.js         # Slash command definitions
│   ├── blacklist/           # Blacklist system
│   │   ├── commands/
│   │   ├── services/
│   │   ├── db/
│   │   ├── ui/
│   │   ├── modals/
│   │   └── slash.js
│   ├── info/                # User information system
│   │   ├── commands/
│   │   ├── services/
│   │   ├── ui/
│   │   └── slash.js
│   ├── permissions/         # Permission management
│   │   ├── commands/
│   │   └── slash.js
│   ├── config/              # Configuration commands
│   ├── utilities/           # Utility commands
│   │   ├── help/            # Interactive help system
│   │   ├── test/            # Testing utilities
│   │   └── ...
│   └── registry.js          # Centralized command/component registry
├── commands/
│   ├── registerCommands.js  # Slash command registration
│   ├── setupColors.js       # Color role setup handler
│   ├── colorMenu.js         # Autorole menu posting
│   └── cleanupCommands.js   # Command cleanup utility
├── events/
│   ├── ready.js             # Bot ready event
│   ├── guildMemberAdd.js    # Welcome & join logs
│   ├── guildMemberRemove.js # Leave logs
│   ├── guildMemberUpdate.js # Boost & server avatar/nickname logs
│   ├── userUpdate.js        # Global avatar logs
│   ├── messageCreate.js     # Message counting & prefix commands
│   ├── messageUpdate.js     # Message edit logs
│   ├── messageDelete.js     # Message delete logs
│   ├── voiceStateUpdate.js  # Voice logs & time tracking
│   └── interactionCreate.js # Slash command handler
├── utils/
│   ├── embeds.js            # Embed builders
│   ├── voiceMod.js          # Voice moderation utilities
│   ├── beforeAfter.js       # Avatar composition utility
│   ├── time.js              # Time formatting utilities
│   ├── duration.js          # Duration parsing and formatting
│   ├── colors.js            # Color utilities
│   ├── avatarManager.js     # Avatar change tracking
│   ├── sanctionScheduler.js # Temporary sanction expiration handler
│   ├── activityRotator.js   # Bot activity rotation
│   └── apiTracker.js        # API request tracking
├── embeds/                  # Legacy embed utilities
├── config/
│   └── emojis.js            # Custom emoji definitions
├── config.js                # Configuration (timezone, GIFs)
├── db.js                    # Database schema & prepared statements
└── index.js                 # Bot entry point
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file (never commit it):

```env
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
GUILD_ID_PRUEBA=your_test_guild_id  # Optional: speeds up command registration

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database
DB_PROVIDER=postgres

# Redis (optional, for cache and performance)
REDIS_URL=redis://localhost:6379
USE_REDIS=true  # Set to false to disable Redis (fallback to PostgreSQL only)
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
    "register": "node src/commands/registerCommands.js",
    "clean:guild": "node src/commands/cleanupCommands.js guild",
    "clean:global": "node src/commands/cleanupCommands.js global",
    "clean:both": "node src/commands/cleanupCommands.js"
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
   /set welcome #welcome-channel [cooldown]
   /set join-log #admin-logs
   ```

   **Color Autoroles**:
   ```
   /setupcolors
   /color-menu
   ```

   **Boost System**:
   ```
   /set booster-role @Boosters  (if using custom booster role)
   /set boost-channel #boosts
   /set info-channel #server-info  (optional, for boost embed)
   ```

   **Logging**:
   ```
   /set message-log #message-logs
   /set avatar-log #avatar-logs
   /set nickname-log #nickname-logs
   /set voice-log #voice-logs
   ```

   **Moderation Setup**:
   ```
   /setmodlog #modlog-channel
   /setblacklistchannel #blacklist-channel
   /createmuterole  (creates and configures mute role automatically)
   # OR
   /setmuterole @Muted  (use existing role)
   ```

---

## 🧠 How It Works

### Moderation Flow

1. Moderator executes a moderation command (e.g., `/warn @user`)
2. Bot validates permissions and role hierarchy
3. Bot opens a modal for the moderator to enter a reason
4. On modal submission, the sanction is applied
5. A case is created in the database
6. Modlog embed is sent to the configured modlog channel
7. DM notification is attempted (user may have DMs disabled)
8. Confirmation message is sent to the command executor

### Temporary Sanctions

- Temporary bans, mutes, and timeouts are tracked with expiration timestamps
- A scheduler checks every minute for expired sanctions
- When a sanction expires, it's automatically removed and an "un" case is created
- The automatic action is logged to the modlog channel

### Permission System

1. Check for explicit command-level policy (DENY → reject, ALLOW → approve)
2. Check for module-level policy (DENY → reject, ALLOW → approve)
3. Fall back to Discord's native permissions
4. Users cannot moderate others with equal or higher roles (except server owner)

### Welcome Flow

1. On `guildMemberAdd`, the bot logs the join (admin log, no cooldown)
2. The public welcome checks the per-user cooldown (persisted in SQLite)
3. If not on cooldown, bot sends:
   - Public mention (outside embed)
   - Rich embed with server title, user avatar, GIF, and localized timestamp
4. Cooldown timestamp is saved to prevent repeated welcomes

### Autoroles Flow

1. `/setupcolors` creates color roles and stores them in the database
2. `/color-menu` posts an embed + select menu (up to 25 options)
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

1. Moderator uses `/voice-mod channel` or `/voice-mod user`
2. Bot creates an interactive embed showing all users in the channel
3. Embed displays real-time mute/deafen status (server vs self)
4. Actions update the embed automatically
5. Embed refreshes when users join/leave or change voice states

### Statistics Tracking

- **Voice time**: Tracked when users join/leave voice channels, accumulated per server
- **Message count**: Incremented for each non-bot message sent
- Statistics are stored per guild and user, accessible via `/user` command

---

## 🔧 Commands Reference

### Configuration Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/set welcome [channel] [cooldown]` | Set the public welcome channel | Manage Guild |
| `/set join-log [channel]` | Set the admin logs channel | Manage Guild |
| `/setmodlog [channel]` | Set the moderation log channel | Manage Guild |
| `/setblacklistchannel [channel]` | Set the blacklist channel | Manage Guild |
| `/createmuterole` | Create and configure mute role automatically | Manage Guild |
| `/setmuterole [role]` | Set an existing role as mute role | Manage Guild |

### Autorole Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/setupcolors` | Create and store default color roles | Manage Roles |
| `/color-menu` | Post/update the color select menu | Manage Roles |

### Boost Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/set booster-role [role]` | Set the Booster role (for gated colors) | Manage Roles |
| `/set boost-channel [channel]` | Set the boost announcement channel | Manage Guild |
| `/set info-channel [channel]` | Set the info/perks channel (for boost embed) | Manage Guild |
| `/preview boost [user]` | Preview the boost embed without boosting | Manage Guild |
| `/preview welcome [user]` | Preview the welcome embed | Manage Guild |

### Logging Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/set message-log [channel]` | Set channel for message edit/delete logs | Manage Guild |
| `/set avatar-log [channel]` | Set channel for avatar change logs | Manage Guild |
| `/set nickname-log [channel]` | Set channel for nickname change logs | Manage Guild |
| `/set voice-log [channel]` | Set channel for voice state logs | Manage Guild |

### Moderation Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/warn [user]` | Warn a user (modal for reason) | Moderate Members |
| `/mute [user] [duration]` | Mute a user with mute role (modal for reason) | Manage Roles |
| `/unmute [user]` | Remove mute from user (modal for reason) | Manage Roles |
| `/timeout [user] [duration]` | Apply Discord timeout (modal for reason) | Moderate Members |
| `/untimeout [user]` | Remove timeout (modal for reason) | Moderate Members |
| `/kick [user]` | Kick a user (modal for reason) | Kick Members |
| `/ban [user] [days]` | Ban a user permanently (modal for reason) | Ban Members |
| `/tempban [user] [duration]` | Temporarily ban a user (modal for reason) | Ban Members |
| `/softban [user] [days]` | Ban and immediately unban (modal for reason) | Ban Members |
| `/unban [user]` | Unban a user (modal for reason) | Ban Members |

### Case Management Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/history [user] [type] [limit]` / `capy!history <user>` | View user's sanction history | Moderate Members |
| `/case [id]` / `capy!case <id>` | View a specific case | Moderate Members |
| `/editcase [id]` | Edit a case's reason (modal for new reason) | Moderate Members |
| `/remove [id] [reason]` | Delete/revert a case | Moderate Members |

### Channel Management Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/clear [amount] [user]` / `capy!clear <amount> [user]` | Delete messages from channel | Manage Messages |
| `/lock [channel] [reason]` | Lock a channel | Manage Channels |
| `/unlock [channel] [reason]` | Unlock a channel | Manage Channels |
| `/slowmode [seconds] [channel]` | Set slowmode | Manage Channels |

### Blacklist Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/blacklist add [user] [severity]` | Add user to blacklist (modal for reason/evidence) | Moderate Members |
| `/blacklist history [user]` | View user's blacklist history | Moderate Members |
| `/blacklist edit [caseid] [newseverity]` | Edit blacklist entry (modal for reason/evidence) | Moderate Members |
| `/blacklist remove [caseid] [reason]` | Remove blacklist entry | Moderate Members |

### Information Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/user [user]` / `capy!user [user]` | View comprehensive user information (Overview, Sanctions, Blacklist, Voice Activity, Recent Messages, Permissions, Statistics) | Moderate Members |

### Voice Moderation Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/voice-mod channel [channel]` | Moderate users in a voice channel | Mute Members / Move Members |
| `/voice-mod user [user]` | Moderate a specific user in voice | Mute Members / Move Members |

### Permission Management Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/modconfig view [type] [user/role]` | View current permission policies | Manage Guild |
| `/modconfig module [module] [effect] [user/role]` | Configure permissions for entire module | Manage Guild |
| `/modconfig command [command] [effect] [user/role]` | Configure permissions for specific command | Manage Guild |
| `/modconfig reset [confirm]` | Reset all permission policies | Manage Guild |

### Prefix Commands

All commands can also be used with the `capy!` prefix (e.g., `capy!ping`, `capy!help`, `capy!warn @user 1h Spam`).

**Moderation Prefix Commands**:
- `capy!warn <user> [duration] <reason>` - Warn a user
- `capy!ban <user> [duration] <reason>` - Ban a user
- `capy!kick <user> <reason>` - Kick a user
- `capy!mute <user> [duration] <reason>` - Mute a user
- `capy!timeout <user> <duration> <reason>` - Apply timeout
- `capy!tempban <user> <duration> <reason>` - Temporary ban
- `capy!history <user>` - View user sanction history
- `capy!case <id>` - View a specific case
- `capy!clear <amount> [user]` - Delete messages
- `capy!unban <user>` - Unban a user

**Utility Prefix Commands**:
- `capy!ping` - Show bot latency and status
- `capy!help` - Show all prefix commands
- `capy!config` - View server configuration

**Info Prefix Commands**:
- `capy!user [user]` - View comprehensive user information

Use `capy!help` to see all available prefix commands with descriptions and aliases.

### Utility Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/help` / `capy!help` | Interactive help system with categorized commands | Everyone |
| `/config` / `capy!config` | View current server configuration | Manage Guild |
| `/ping` / `capy!ping` | Show bot latency, uptime, and memory | Everyone |

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
- `modlog_channel_id`
- `blacklist_channel_id`
- `mute_role_id`
- `dm_on_punish`

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

### `mod_cases`
Stores moderation cases:
- `id` (PRIMARY KEY, AUTOINCREMENT)
- `guild_id`, `type`, `target_id`, `moderator_id`, `reason`
- `created_at`, `expires_at`
- `active` (INTEGER, 0 or 1)
- `deleted_at`, `deleted_by`, `deleted_reason`
- `metadata` (TEXT, JSON string)

### `mod_policy`
Stores permission override policies:
- `guild_id`, `command_key`, `subject_type`, `subject_id` (PRIMARY KEY)
- `effect` (ALLOW or DENY)
- `created_at`, `created_by`

### `blacklist`
Stores blacklist entries:
- `id` (PRIMARY KEY, AUTOINCREMENT)
- `guild_id`, `user_id`, `moderator_id`
- `reason`, `evidence`, `severity`
- `created_at`, `updated_at`, `updated_by`
- `deleted_at`, `deleted_by`, `deleted_reason`

### `voice_activity`
Tracks voice channel activity:
- `id` (PRIMARY KEY, AUTOINCREMENT)
- `guild_id`, `user_id`, `action`, `channel_id`, `at`

### `message_log`
Tracks recent messages:
- `id` (PRIMARY KEY, AUTOINCREMENT)
- `guild_id`, `user_id`, `channel_id`, `message_id`
- `content`, `at`

### `pending_actions`
Stores context for modal interactions:
- `id` (PRIMARY KEY, AUTOINCREMENT)
- `guild_id`, `author_id`, `command`
- `payload_json` (TEXT, JSON string)
- `created_at`

**Note**: Migrations are idempotent; the `db.js` helper ensures columns and tables exist even if you update the bot later.

---

## 🧪 Testing Tips

### Moderation System
- Test all sanction types (warn, mute, timeout, kick, ban, etc.)
- Verify modlog entries are created correctly
- Check DM notifications are sent (if user has DMs enabled)
- Test temporary sanctions expire correctly
- Verify role hierarchy protection works (users can't moderate equal/higher roles)

### Blacklist System
- Add users to blacklist with different severity levels
- Edit blacklist entries
- Verify blacklist is separate from sanctions history
- Check blacklist channel logging

### Permission System
- Configure module-level permissions
- Configure command-level permissions
- Test DENY policies override ALLOW policies
- Verify Discord native permissions work as fallback
- Test `/modconfig view` to see current policies

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
- Use `/voice-mod channel` → see all users in channel
- Mute a user → embed updates automatically
- User joins/leaves → embed refreshes automatically
- Test with server mute vs self mute to see different icons

### Statistics
- Use `/user` command to view comprehensive user information
- Join voice channels to accumulate time
- Send messages to increment count

### Ping
- `/ping` should show reasonable WS ping and DB ping values
- Uptime should increase over time
- Memory usage should be stable

---

## 🛟 Troubleshooting

### Moderation commands not working
- ✅ Ensure bot has required permissions (Moderate Members, Manage Roles, Ban Members, etc.)
- ✅ Verify mute role is configured (`/createmuterole` or `/setmuterole`)
- ✅ Check bot's role is above target user's highest role
- ✅ Verify modlog channel is configured (`/setmodlog`)
- ✅ Check permission policies in `/modconfig view`

### No color applied/removed
- ✅ Ensure the bot's role is **above** all color roles in hierarchy
- ✅ The select menu can't exceed 25 options (Discord limit)
- ✅ Check bot has `Manage Roles` permission

### No welcome message
- ✅ Check **Server Members Intent** is enabled in Discord Developer Portal
- ✅ Confirm the configured welcome channel exists
- ✅ Verify bot has `Send Messages` and `Embed Links` permissions
- ✅ Check cooldown hasn't expired (use `/set welcome` to adjust)

### No boost announcements
- ✅ Set the boost channel with `/set boost-channel`
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
- Moderation commands use modals for collecting reasons (better UX), prefix commands accept reason directly
- Temporary sanctions automatically expire and create "un" cases
- Permission system supports both module and command-level control
- Blacklist is completely separate from the moderation case system
- **All logs use Discord Webhooks** for improved performance and to eliminate rate limits
- Redis is optional - bot works fully without it (fallback to PostgreSQL)
- Webhooks are automatically created and cached - no manual setup required
- Both slash commands (`/command`) and prefix commands (`capy!command`) are supported

---

## 🔄 Migration from v1.x

If you're migrating from v1.x:

1. **Database**: The existing `data/bot.db` will continue to work - new tables and columns are added automatically.

2. **Commands**: Some commands have been restructured:
   - `/setwelcome` → `/set welcome`
   - `/postautoroles` → `/color-menu`
   - Old moderation commands replaced with new modal-based system

3. **Configuration**: All existing settings will be preserved, but you'll need to configure:
   - Modlog channel (`/setmodlog`)
   - Blacklist channel (`/setblacklistchannel`)
   - Mute role (`/createmuterole` or `/setmuterole`)

4. **Permissions**: New permission system is backward compatible - existing Discord permissions continue to work.

---

## 📄 License

This project is provided as-is for educational and personal use.

---

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

---

**Made with ❤️ using Discord.js v14**
