export function getRedisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not configured');
  return {
    url,
    maxRetriesPerRequest: null,
  };
}
