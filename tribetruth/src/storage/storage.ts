import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureDefaultProfile, getActiveProfileId } from './profileStore';

const CURRENT_TRIBE_KEY = 'currentTribe';
const CURRENT_MONTH_KEY = 'currentMonth';
const FREE_MODE_KEY = 'freeMode';
const PREFERRED_VOICE_KEY = 'preferredVoice';
const COMPLETION_PREFIX = 'completion:';
const RECITE_PREFIX = 'reciteCount:';

// Format local date as YYYY-MM-DD to avoid timezone shifts
export function getLocalYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildCompletionKey(profileId: string, date: string, blessingId: string): string {
  return `${COMPLETION_PREFIX}${profileId}:${blessingId}:${date}`;
}

function buildReciteCountKey(profileId: string, date: string, blessingId: string): string {
  return `${RECITE_PREFIX}${profileId}:${date}:${blessingId}`;
}

let progressMigrationPromise: Promise<void> | null = null;

async function ensureProgressMigration(): Promise<void> {
  if (!progressMigrationPromise) {
    progressMigrationPromise = (async () => {
      const defaultProfileId = await ensureDefaultProfile();
      const allKeys = await AsyncStorage.getAllKeys();
      const completionKeys = allKeys.filter((key) => key.startsWith(COMPLETION_PREFIX));
      const reciteKeys = allKeys.filter((key) => key.startsWith(RECITE_PREFIX));
      let migrated = false;

      for (const key of completionKeys) {
        const parts = key.split(':');
        if (parts.length === 3) {
          const [, blessingId, date] = parts;
          const newKey = buildCompletionKey(defaultProfileId, date, blessingId);
          const value = await AsyncStorage.getItem(key);
          if (value !== null) {
            await AsyncStorage.setItem(newKey, value);
          }
          await AsyncStorage.removeItem(key);
          migrated = true;
        }
      }

      for (const key of reciteKeys) {
        const parts = key.split(':');
        if (parts.length === 3) {
          const [, date, blessingId] = parts;
          const newKey = buildReciteCountKey(defaultProfileId, date, blessingId);
          const value = await AsyncStorage.getItem(key);
          if (value !== null) {
            await AsyncStorage.setItem(newKey, value);
          }
          await AsyncStorage.removeItem(key);
          migrated = true;
        }
      }

      if (migrated) {
        if (__DEV__) {
          console.log('DEBUG: Migrated progress records to profile', defaultProfileId);
        }
      }
    })();
  }
  return progressMigrationPromise;
}

export async function getDailyCompletions(): Promise<Set<string>> {
  await ensureProgressMigration();
  const profileId = await getActiveProfileId();
  const allKeys = await AsyncStorage.getAllKeys();
  const completionKeys = allKeys.filter(
    (key) => key.startsWith(`${COMPLETION_PREFIX}${profileId}:`)
  );
  const completionData = await AsyncStorage.multiGet(completionKeys);

  const completedDates = new Set<string>();
  completionData.forEach(([key, value]) => {
    if (value === 'true') {
      const parts = key.split(':');
      const date = parts[3];
      if (date) {
        completedDates.add(date);
      }
    }
  });

  return completedDates;
}

export async function getDailyCompletion(
  date: string,
  blessingId: string
): Promise<boolean> {
  await ensureProgressMigration();
  const profileId = await getActiveProfileId();
  const value = await AsyncStorage.getItem(buildCompletionKey(profileId, date, blessingId));
  return value === 'true';
}

export async function setDailyCompletion(
  date: string,
  blessingId: string
): Promise<void> {
  await ensureProgressMigration();
  const profileId = await getActiveProfileId();
  await AsyncStorage.setItem(buildCompletionKey(profileId, date, blessingId), 'true');
}

export async function clearDailyCompletion(
  date: string,
  blessingId: string
): Promise<void> {
  await ensureProgressMigration();
  const profileId = await getActiveProfileId();
  await AsyncStorage.removeItem(buildCompletionKey(profileId, date, blessingId));
}

export async function getReciteCount(
  date: string,
  blessingId: string
): Promise<number> {
  await ensureProgressMigration();
  const profileId = await getActiveProfileId();
  const value = await AsyncStorage.getItem(buildReciteCountKey(profileId, date, blessingId));
  const parsed = value ? parseInt(value, 10) : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function setReciteCount(
  date: string,
  blessingId: string,
  count: number
): Promise<void> {
  await ensureProgressMigration();
  const profileId = await getActiveProfileId();
  await AsyncStorage.setItem(buildReciteCountKey(profileId, date, blessingId), String(count));
}

export async function clearReciteCount(
  date: string,
  blessingId: string
): Promise<void> {
  await ensureProgressMigration();
  const profileId = await getActiveProfileId();
  await AsyncStorage.removeItem(buildReciteCountKey(profileId, date, blessingId));
}

export async function getCurrentTribe(): Promise<string> {
  const stored = await AsyncStorage.getItem(CURRENT_TRIBE_KEY);
  const value = stored ?? '1';
  if (!stored) {
    await AsyncStorage.setItem(CURRENT_TRIBE_KEY, value);
  }
  return value;
}

export async function getCurrentMonth(): Promise<number> {
  const stored = await AsyncStorage.getItem(CURRENT_MONTH_KEY);
  const parsed = stored ? parseInt(stored, 10) : 1;
  const value = Number.isNaN(parsed) ? 1 : Math.min(12, Math.max(1, parsed));
  if (!stored) {
    await AsyncStorage.setItem(CURRENT_MONTH_KEY, String(value));
  }
  return value;
}

export async function setCurrentMonth(month: number): Promise<void> {
  const clamped = Math.min(12, Math.max(1, month));
  await AsyncStorage.setItem(CURRENT_MONTH_KEY, String(clamped));
}

export async function setCurrentTribe(id: string): Promise<void> {
  await AsyncStorage.setItem(CURRENT_TRIBE_KEY, id);
}

export async function getFreeMode(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(FREE_MODE_KEY);
  if (stored === null) {
    await AsyncStorage.setItem(FREE_MODE_KEY, 'false');
    return false;
  }
  return stored === 'true';
}

export async function setFreeMode(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(FREE_MODE_KEY, enabled ? 'true' : 'false');
}

export async function clearProgress(): Promise<void> {
  await ensureProgressMigration();
  const profileId = await getActiveProfileId();
  const allKeys = await AsyncStorage.getAllKeys();
  const keysToRemove = allKeys.filter(
    (key) =>
      key.startsWith(`${COMPLETION_PREFIX}${profileId}:`) ||
      key.startsWith(`${RECITE_PREFIX}${profileId}:`)
  );
  if (keysToRemove.length > 0) {
    await AsyncStorage.multiRemove(keysToRemove);
  }
}

export async function getPreferredVoice(): Promise<'male' | 'female'> {
  const stored = await AsyncStorage.getItem(PREFERRED_VOICE_KEY);
  if (stored === 'female') {
    return 'female';
  }
  return 'male'; // Default to male
}

export async function setPreferredVoice(voice: 'male' | 'female'): Promise<void> {
  await AsyncStorage.setItem(PREFERRED_VOICE_KEY, voice);
}

