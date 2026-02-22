import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'sync:queue';

const readQueue = async (): Promise<string[]> => {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeQueue = async (ids: string[]) => {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(ids));
};

export const enqueueDirtyRecord = async (recordId: string) => {
  const queue = await readQueue();
  if (!queue.includes(recordId)) {
    queue.push(recordId);
    await writeQueue(queue);
  }
};

export const dequeueRecord = async (recordId: string) => {
  const queue = await readQueue();
  const next = queue.filter((id) => id !== recordId);
  await writeQueue(next);
};

export const listQueuedRecordIds = async () => {
  return readQueue();
};

export const clearQueue = async () => {
  await writeQueue([]);
};
