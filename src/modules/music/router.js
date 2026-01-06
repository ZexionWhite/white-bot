/**
 * Router de comandos de música
 */
import * as play from "./commands/play.js";
import * as queue from "./commands/queue.js";
import * as nowplaying from "./commands/nowplaying.js";
import * as skip from "./commands/skip.js";
import * as stop from "./commands/stop.js";
import * as pause from "./commands/pause.js";
import * as resume from "./commands/resume.js";
import * as clear from "./commands/clear.js";
import * as loop from "./commands/loop.js";
import * as shuffle from "./commands/shuffle.js";
import * as autoplay from "./commands/autoplay.js";
import * as dj from "./commands/dj.js";

export const musicHandlers = {
  play: play.handle,
  queue: queue.handle,
  nowplaying: nowplaying.handle,
  skip: skip.handle,
  stop: stop.handle,
  pause: pause.handle,
  resume: resume.handle,
  clearqueue: clear.handle,
  loop: loop.handle,
  shuffle: shuffle.handle,
  autoplay: autoplay.handle,
  dj: dj.handle
};
