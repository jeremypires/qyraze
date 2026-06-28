import { Worker } from 'bullmq';
import { QUEUE_NAMES, type ProcessMessageJob } from '@qyraze/shared';
import { getRedisConnection } from './queues/connection.js';
import { handleProcessMessage } from './jobs/process-message.js';

function startWorkers() {
  const messageWorker = new Worker<ProcessMessageJob>(
    QUEUE_NAMES.messages,
    async (job) => {
      await handleProcessMessage(job.data);
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    }
  );

  messageWorker.on('completed', (job) => {
    console.log(`[messages] completed ${job.id}`);
  });

  messageWorker.on('failed', (job, err) => {
    console.error(`[messages] failed ${job?.id}`, err);
  });

  console.log('Worker listening on queue:', QUEUE_NAMES.messages);
}

startWorkers();
