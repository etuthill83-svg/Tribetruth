import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, StatusBar } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import SecondaryButton from '../components/SecondaryButton';
import { spacing, textStyles } from '../theme/theme';
import { getActiveProfileId, getProfileName, getProfiles, setActiveProfileId } from '../storage/profileStore';
import { getPreferredVoice, setPreferredVoice } from '../storage/storage';

export default function SettingsScreen() {
  const [activeProfileId, setActiveProfileIdState] = useState('local-default');
  const [voicePreference, setVoicePreferenceState] = useState<'male' | 'female'>('male');

  const loadProfile = useCallback(async () => {
    const id = await getActiveProfileId();
    setActiveProfileIdState(id);
  }, []);

  const loadVoicePreference = useCallback(async () => {
    const voice = await getPreferredVoice();
    setVoicePreferenceState(voice);
  }, []);

  useEffect(() => {
    void loadProfile();
    void loadVoicePreference();
  }, [loadProfile, loadVoicePreference]);

  const handleSwitchProfile = async (id: string) => {
    await setActiveProfileId(id);
    setActiveProfileIdState(id);
  };

  const handleVoiceChange = async (voice: 'male' | 'female') => {
    await setPreferredVoice(voice);
    setVoicePreferenceState(voice);
  };

  return (
    <Screen style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <Text style={[textStyles.title, styles.blackText]}>Settings</Text>
      <Card>
        <Text style={styles.sectionLabel}>Profile</Text>
        <Text style={styles.profileName}>{getProfileName(activeProfileId)}</Text>
        <View style={styles.profileButtons}>
          {getProfiles().map((profile) => (
            <SecondaryButton
              key={profile.id}
              title={profile.name}
              onPress={() => void handleSwitchProfile(profile.id)}
            />
          ))}
        </View>
      </Card>
      
      <Card>
        <Text style={styles.sectionLabel}>Voice Preference</Text>
        <Text style={styles.description}>Choose the voice for Auto Read narration</Text>
        <View style={styles.voiceToggleContainer}>
          <Pressable
            style={[
              styles.voiceButton,
              voicePreference === 'male' && styles.voiceButtonActive,
            ]}
            onPress={() => void handleVoiceChange('male')}
          >
            <Text
              style={[
                styles.voiceButtonText,
                voicePreference === 'male' && styles.voiceButtonTextActive,
              ]}
            >
              Male
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.voiceButton,
              voicePreference === 'female' && styles.voiceButtonActive,
            ]}
            onPress={() => void handleVoiceChange('female')}
          >
            <Text
              style={[
                styles.voiceButtonText,
                voicePreference === 'female' && styles.voiceButtonTextActive,
              ]}
            >
              Female
            </Text>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
  },
  sectionLabel: {
    ...textStyles.label,
    color: '#000000',
  },
  profileName: {
    ...textStyles.subtitle,
    color: '#000000',
  },
  profileButtons: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  blackText: {
    color: '#000000',
  },
  description: {
    ...textStyles.body,
    color: '#666666',
    fontSize: 14,
    marginTop: spacing.xs,
  },
  voiceToggleContainer: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  voiceButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  voiceButtonActive: {
    borderColor: '#FFD700',
    backgroundColor: '#FFF8DC',
  },
  voiceButtonText: {
    ...textStyles.body,
    color: '#666666',
    fontWeight: '600',
  },
  voiceButtonTextActive: {
    color: '#000000',
  },
});
