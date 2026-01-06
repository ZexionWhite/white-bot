/**
 * Servicio de gestión de cola de reproducción
 * Maneja la cola de tracks por guild
 */

// Almacenamiento en memoria: guildId -> Queue
const queues = new Map();

/**
 * Representa una cola de reproducción
 */
export class Queue {
  constructor(guildId) {
    this.guildId = guildId;
    this.tracks = [];
    this.currentIndex = -1;
  }

  /**
   * Añade un track a la cola
   * @param {object} track - Track de Lavalink
   * @param {string} requesterId - ID del usuario que lo solicitó
   */
  enqueue(track, requesterId) {
    this.tracks.push({
      track,
      requesterId,
      identifier: track.info.identifier
    });
  }

  /**
   * Obtiene el siguiente track sin removerlo
   * @returns {object|null}
   */
  peek() {
    if (this.tracks.length === 0) return null;
    return this.tracks[0];
  }

  /**
   * Remueve y retorna el siguiente track
   * @returns {object|null}
   */
  dequeue() {
    if (this.tracks.length === 0) return null;
    return this.tracks.shift();
  }

  /**
   * Obtiene todos los tracks
   * @returns {Array}
   */
  getAll() {
    return [...this.tracks];
  }

  /**
   * Limpia la cola
   */
  clear() {
    this.tracks = [];
    this.currentIndex = -1;
  }

  /**
   * Mezcla la cola aleatoriamente
   */
  shuffle() {
    if (this.tracks.length <= 1) return;
    
    // Fisher-Yates shuffle
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
  }

  /**
   * Obtiene el tamaño de la cola
   * @returns {number}
   */
  size() {
    return this.tracks.length;
  }

  /**
   * Verifica si la cola está vacía
   * @returns {boolean}
   */
  isEmpty() {
    return this.tracks.length === 0;
  }

  /**
   * Remueve un track por índice
   * @param {number} index - Índice del track (0-based)
   * @returns {boolean}
   */
  remove(index) {
    if (index < 0 || index >= this.tracks.length) return false;
    this.tracks.splice(index, 1);
    return true;
  }

  /**
   * Calcula la duración total de la cola
   * @returns {number} Duración en milisegundos
   */
  getTotalDuration() {
    return this.tracks.reduce((total, item) => {
      return total + (item.track.info.length || 0);
    }, 0);
  }
}

/**
 * Obtiene o crea una cola para un guild
 * @param {string} guildId - ID del guild
 * @returns {Queue}
 */
export function getQueue(guildId) {
  if (!queues.has(guildId)) {
    queues.set(guildId, new Queue(guildId));
  }
  return queues.get(guildId);
}

/**
 * Elimina la cola de un guild
 * @param {string} guildId - ID del guild
 */
export function deleteQueue(guildId) {
  queues.delete(guildId);
}

/**
 * Obtiene todas las colas (para debugging)
 * @returns {Map}
 */
export function getAllQueues() {
  return queues;
}
