const queues = new Map();

export class Queue {
  constructor(guildId) {
    this.guildId = guildId;
    this.tracks = [];
    this.currentIndex = -1;
  }

  enqueue(track, requesterId) {
    this.tracks.push({
      track,
      requesterId,
      identifier: track.info.identifier
    });
  }

  peek() {
    if (this.tracks.length === 0) return null;
    return this.tracks[0];
  }

  dequeue() {
    if (this.tracks.length === 0) return null;
    return this.tracks.shift();
  }

  getAll() {
    return [...this.tracks];
  }

  clear() {
    this.tracks = [];
    this.currentIndex = -1;
  }

  shuffle() {
    if (this.tracks.length <= 1) return;
    
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
  }

  size() {
    return this.tracks.length;
  }

  isEmpty() {
    return this.tracks.length === 0;
  }

  remove(index) {
    if (index < 0 || index >= this.tracks.length) return false;
    this.tracks.splice(index, 1);
    return true;
  }

  getTotalDuration() {
    return this.tracks.reduce((total, item) => {
      return total + (item.track.info.length || 0);
    }, 0);
  }
}

export function getQueue(guildId) {
  if (!queues.has(guildId)) {
    queues.set(guildId, new Queue(guildId));
  }
  return queues.get(guildId);
}

export function deleteQueue(guildId) {
  queues.delete(guildId);
}

export function getAllQueues() {
  return queues;
}
