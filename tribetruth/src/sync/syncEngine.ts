import { listQueuedRecordIds } from './syncQueueStore';

export const runSyncOnce = async () => {
  const queued = await listQueuedRecordIds();
  console.log('DEBUG: runSyncOnce would sync records', queued);
};
