/**
 * SSE клиенттер тізімі.
 * userId → Set<res> байланысын сақтайды.
 * Модуль синглтон ретінде жұмыс істейді.
 */

const clients = new Map(); // Map<userId: string, Set<res>>

/** Жаңа SSE клиент қосу */
const add = (userId, res) => {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
};

/** SSE клиент жою (байланыс үзілгенде) */
const remove = (userId, res) => {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(userId);
};

/** Белгілі пайдаланушыға хабарлама жіберу */
const broadcast = (userId, payload) => {
  const set = clients.get(userId);
  if (!set || set.size === 0) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  set.forEach((res) => {
    try { res.write(data); } catch (_) { /* байланыс үзілген */ }
  });
};

module.exports = { add, remove, broadcast };
