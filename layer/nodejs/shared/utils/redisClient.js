const { createClient } = require("redis");

const REDIS_URL = process.env.REDIS_URL || process.env.ELASTICACHE_ENDPOINT || "redis://127.0.0.1:6379";

let client;
let connectionFailed = false; // 연결 실패 플래그
let lastConnectAttempt = 0;
const CONNECT_TIMEOUT = 2000; // 2초 타임아웃
const CONNECT_RETRY_INTERVAL = 30000; // 30초마다 재시도 (목업 Redis 사용 중)

function getRedisClient() {
  if (client) return client;

  client = createClient({ 
    url: REDIS_URL,
    socket: {
      connectTimeout: CONNECT_TIMEOUT,
      reconnectStrategy: false // 자동 재연결 비활성화 (목업 Redis 사용 중)
    }
  });

  client.on("error", (err) => {
    // 목업 Redis 사용 중이므로 에러 로그 최소화
    connectionFailed = true;
  });

  // 연결은 지연 초기화. 첫 사용 시 connect 보장
  const originalConnect = client.connect.bind(client);
  let connectingPromise = null;

  async function ensureConnected() {
    // 이미 연결되어 있으면 반환
    if (client.isOpen) {
      connectionFailed = false;
      return;
    }
    
    // 최근에 연결 시도했고 실패했으면, 재시도 간격이 지나지 않았으면 즉시 실패
    const now = Date.now();
    if (connectionFailed && (now - lastConnectAttempt) < CONNECT_RETRY_INTERVAL) {
      throw new Error('Redis connection failed, skipping'); // 즉시 실패
    }
    
    // 연결 시도
    lastConnectAttempt = now;
    if (!connectingPromise) {
      connectingPromise = Promise.race([
        originalConnect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), CONNECT_TIMEOUT)
        )
      ]).then(() => {
        connectionFailed = false; // 성공 시 플래그 리셋
        connectingPromise = null;
      }).catch(err => {
        connectionFailed = true;
        connectingPromise = null; // 실패 시 다음 시도를 위해 초기화
        throw err;
      });
    }
    
    try {
      await connectingPromise;
    } catch (err) {
      // 연결 실패는 throw하여 상위에서 처리하도록 함
      throw err;
    }
  }

  // 안전 래퍼: get/set/del/expire
  client.safeGet = async (key) => {
    try {
      await ensureConnected();
      return await client.get(key);
    } catch (e) {
      return null; // Redis 없이도 작동 (목업 Redis 사용 중)
    }
  };

  client.safeSetEx = async (key, ttlSeconds, value) => {
    try {
      await ensureConnected();
      await client.setEx(key, ttlSeconds, value);
      return true;
    } catch (e) {
      return false; // Redis 없이도 작동 (목업 Redis 사용 중)
    }
  };

  client.safeDel = async (key) => {
    try {
      await ensureConnected();
      await client.del(key);
      return true;
    } catch (e) {
      return false; // Redis 없이도 작동 (목업 Redis 사용 중)
    }
  };

  return client;
}

module.exports = {
  getRedisClient,
};
