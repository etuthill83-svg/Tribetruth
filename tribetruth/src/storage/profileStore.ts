import AsyncStorage from '@react-native-async-storage/async-storage';

export type Profile = {
  id: string;
  name: string;
};

export const DEFAULT_PROFILE_ID = 'local-default';

const ACTIVE_PROFILE_KEY = 'activeProfileId';
const PROFILES: Profile[] = [
  { id: 'local-default', name: 'Default' },
  { id: 'local-guest', name: 'Guest' },
];

export const getProfiles = () => PROFILES;

export const ensureDefaultProfile = async (): Promise<string> => {
  const stored = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
  if (!stored) {
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, DEFAULT_PROFILE_ID);
    return DEFAULT_PROFILE_ID;
  }
  return stored;
};

export const getActiveProfileId = async (): Promise<string> => {
  return ensureDefaultProfile();
};

export const setActiveProfileId = async (profileId: string): Promise<void> => {
  await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  if (__DEV__) {
    console.log('DEBUG: Active profile changed', profileId);
  }
};

export const getProfileName = (profileId: string): string => {
  return PROFILES.find((profile) => profile.id === profileId)?.name ?? 'Unknown';
};
