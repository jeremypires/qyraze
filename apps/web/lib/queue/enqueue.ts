import { Queue } from 'bullmq';
import { QUEUE_NAMES, type ProcessMessageJob } from '@qyraze/shared';

function getRedisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not configured');
  return {
    url,
    maxRetriesPerRequest: null,
  };
}

let messagesQueue: Queue<ProcessMessageJob> | null = null;

export function getMessagesQueue() {
  if (!messagesQueue) {
    messagesQueue = new Queue<ProcessMessageJob>(QUEUE_NAMES.messages, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
  }
  return messagesQueue;
}

export async function enqueueProcessMessage(job: ProcessMessageJob) {
  const queue = getMessagesQueue();
  await queue.add('process-message', job, {
    jobId: `msg:${job.messageId}`,
  });
}
