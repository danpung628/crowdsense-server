const { createClient } = require("redis");

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let client;

function getRedisClient() {
  if (client) return client;

  client = createClient({ url: REDIS_URL });

  client.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  // 연결은 지연 초기화. 첫 사용 시 connect 보장
  const originalConnect = client.connect.bind(client);
  let connectingPromise = null;

  async function ensureConnected() {
    if (client.isOpen) return;
    if (!connectingPromise) connectingPromise = originalConnect();
    await connectingPromise;
  }

  // 안전 래퍼: get/set/del/expire
  client.safeGet = async (key) => {
    try {
      await ensureConnected();
      return await client.get(key);
    } catch (e) {
      return null;
    }
  };

  client.safeSetEx = async (key, ttlSeconds, value) => {
    try {
      await ensureConnected();
      await client.setEx(key, ttlSeconds, value);
      return true;
    } catch (e) {
      return false;
    }
  };

  client.safeDel = async (key) => {
    try {
      await ensureConnected();
      await client.del(key);
      return true;
    } catch (e) {
      return false;
    }
  };

  return client;
}

module.exports = {
  getRedisClient,
};


