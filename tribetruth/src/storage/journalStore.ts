import AsyncStorage from '@react-native-async-storage/async-storage';

type JournalEntry = {
  dateKey: string;
  tribeId: string;
  text: string;
  updatedAt: string;
  audioClips?: JournalAudioClip[];
};

type JournalAudioClip = {
  id: string;
  uri: string;
  durationMs: number;
  createdAt: string;
};

type JournalInput = {
  dateKey: string;
  tribeId: string;
  text: string;
};

const buildJournalKey = (dateKey: string, tribeId: string) =>
  `journal:${dateKey}:${tribeId}`;

export const upsertDailyJournal = async ({ dateKey, tribeId, text }: JournalInput) => {
  try {
    const updatedAt = new Date().toISOString();
    const raw = await AsyncStorage.getItem(buildJournalKey(dateKey, tribeId));
    const existing = raw ? (JSON.parse(raw) as JournalEntry) : null;
    const payload: JournalEntry = {
      dateKey,
      tribeId,
      text,
      updatedAt,
      audioClips: existing?.audioClips ?? [],
    };
    await AsyncStorage.setItem(buildJournalKey(dateKey, tribeId), JSON.stringify(payload));
  } catch (error) {
    console.warn('Journal write failed:', error);
  }
};

export const addDailyJournalAudioClip = async ({
  dateKey,
  tribeId,
  clip,
}: {
  dateKey: string;
  tribeId: string;
  clip: JournalAudioClip;
}) => {
  try {
    const updatedAt = new Date().toISOString();
    const raw = await AsyncStorage.getItem(buildJournalKey(dateKey, tribeId));
    const existing = raw ? (JSON.parse(raw) as JournalEntry) : null;
    const audioClips = [...(existing?.audioClips ?? []), clip];
    const payload: JournalEntry = {
      dateKey,
      tribeId,
      text: existing?.text ?? '',
      updatedAt,
      audioClips,
    };
    await AsyncStorage.setItem(buildJournalKey(dateKey, tribeId), JSON.stringify(payload));
  } catch (error) {
    console.warn('Journal audio clip write failed:', error);
  }
};

export type { JournalAudioClip, JournalEntry };

export const getDailyJournal = async ({ dateKey, tribeId }: Omit<JournalInput, 'text'>) => {
  try {
    const raw = await AsyncStorage.getItem(buildJournalKey(dateKey, tribeId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as JournalEntry;
    return parsed;
  } catch (error) {
    console.warn('Journal read failed:', error);
    return null;
  }
};
