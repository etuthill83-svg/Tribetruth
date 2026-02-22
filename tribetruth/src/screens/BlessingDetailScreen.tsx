import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Keyboard,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  KeyboardAvoidingView,
  View,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Asset } from 'expo-asset';
import {
  clearDailyCompletion,
  clearReciteCount,
  getCurrentMonth,
  getCurrentTribe,
  getDailyCompletion,
  getFreeMode,
  getLocalYMD,
  getPreferredVoice,
  getReciteCount,
  setDailyCompletion,
  setFreeMode,
  setReciteCount,
} from '../storage/storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { RootStackParamList } from '../navigation/AppNavigator';
import blessingsData from '../data/blessings.json';
import Screen from '../components/Screen';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import SectionHeader from '../components/SectionHeader';
import InlineToggle from '../components/InlineToggle';
import Pill from '../components/Pill';
import { colors, spacing, textStyles } from '../theme/theme';
import tribeImages from '../data/tribeImages';
import { useReubenAudio } from '../hooks/useReubenAudio';
import MusicContext from '../context/MusicContext';
import ScreenBackground from '../components/ScreenBackground';
import {
  addDailyJournalAudioClip,
  getDailyJournal,
  upsertDailyJournal,
  type JournalAudioClip,
} from '../storage/journalStore';

type Props = NativeStackScreenProps<RootStackParamList, 'BlessingDetail'>;

type Blessing = {
  id: string;
  tribe: string;
  month: string;
  title: string;
  text: string;
  audioUrl?: string;
  voiceNarrationUrl?: string;
  alignmentJsonUrl?: string;
  maleAudioUrl?: string;
  maleJsonUrl?: string;
  femaleAudioUrl?: string;
  femaleJsonUrl?: string;
  inspiration: {
    scriptures: { ref: string; text?: string }[];
    videos: { title: string; url: string }[];
    songs: { title: string; url: string; artist?: string }[];
  };
};

type TabKey = 'recite' | 'inspiration';

const blessings = blessingsData as Blessing[];
export default function BlessingDetailScreen({ route }: Props) {
  const { isMuted, setMuted } = useContext(MusicContext);
  const [tab, setTab] = useState<TabKey>('recite');
  const [count, setCount] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);
  const [hasLoadedCount, setHasLoadedCount] = useState(false);
  const [currentId, setCurrentId] = useState<string>('1');
  const [currentMonth, setCurrentMonth] = useState(1);
  const [freeMode, setFreeModeState] = useState(false);
  const [text, setText] = useState('');
  const [lastSavedText, setLastSavedText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [audioClips, setAudioClips] = useState<JournalAudioClip[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  
  const [isVoiceNarrationPlaying, setIsVoiceNarrationPlaying] = useState(false);
  const [alignmentData, setAlignmentData] = useState<any>(null);
  const [isLoadingAlignment, setIsLoadingAlignment] = useState(false);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number>(-1);
  const [processedWords, setProcessedWords] = useState<Array<{ word: string; startMs: number; endMs: number }>>([]);
  const [voicePreference, setVoicePreference] = useState<'male' | 'female'>('male');
  const scrollViewRef = useRef<ScrollView | null>(null);
  const audioPositionRef = useRef<number>(0);
  const currentWordIndexRef = useRef<number>(-1);
  const highlightedWordIndexRef = useRef<number>(-1);
  const rafIdRef = useRef<number | null>(null); // requestAnimationFrame ID
  const recordingRef = useRef<Audio.Recording | null>(null);
  const playbackRef = useRef<Audio.Sound | null>(null);
  const voiceNarrationRef = useRef<Audio.Sound | null>(null);
  const [journalLayoutY, setJournalLayoutY] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const headerHeight = useHeaderHeight();
  const blessing = useMemo(
    () => blessings.find((item) => item.id === route.params.id),
    [route.params.id]
  );
  const { isLoading: isAudioLoading, isAudioReady } = useReubenAudio(blessing?.audioUrl);
  const inspiration = blessing?.inspiration;
  const scriptures = inspiration?.scriptures ?? [];
  const videos = inspiration?.videos ?? [];
  const songs = inspiration?.songs ?? [];
  const imageSet = tribeImages[route.params.id];
  const headerSource = imageSet?.header;
  const today = useMemo(() => getLocalYMD(new Date()), [route.params.id]);
  const tribeId = String(route.params.id);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasNarration = !!(
    (blessing?.maleAudioUrl && blessing?.maleJsonUrl) ||
    (blessing?.femaleAudioUrl && blessing?.femaleJsonUrl)
  );

  // Load voice preference
  useEffect(() => {
    const loadVoicePreference = async () => {
      const voice = await getPreferredVoice();
      setVoicePreference(voice);
    };
    void loadVoicePreference();
  }, []);

  // Get the appropriate URLs based on voice preference
  const getVoiceUrls = () => {
    if (!blessing) return { audioUrl: null, jsonUrl: null };
    
    if (voicePreference === 'female' && blessing.femaleAudioUrl && blessing.femaleJsonUrl) {
      return { audioUrl: blessing.femaleAudioUrl, jsonUrl: blessing.femaleJsonUrl };
    }
    
    // Default to male if available
    if (blessing.maleAudioUrl && blessing.maleJsonUrl) {
      return { audioUrl: blessing.maleAudioUrl, jsonUrl: blessing.maleJsonUrl };
    }
    
    return { audioUrl: null, jsonUrl: null };
  };

  // Fetch alignment JSON if narration is available
  useEffect(() => {
    if (!hasNarration || !blessing) {
      console.log('!!! SKIP FETCH: hasNarration=', hasNarration, 'blessing=', !!blessing);
      return;
    }
    
    const fetchAlignment = async () => {
      console.log('!!! FETCH FUNCTION CALLED - Starting alignment fetch...');
      setIsLoadingAlignment(true);
      
      let finalWords: Array<{ word: string; startMs: number; endMs: number }> = [];
      
      try {
        const { jsonUrl } = getVoiceUrls();
        if (!jsonUrl) {
          console.log('!!! No JSON URL available for current voice preference');
          return;
        }
        
        console.log('!!! Fetching from URL:', jsonUrl);
        
        const response = await fetch(jsonUrl);
        console.log('!!! JSON FETCH STATUS:', response.status);
        
        const data: Array<{ word: string; startMs: number }> = await response.json();
        console.log('!!! RECEIVED', data.length, 'words from JSON');
        
        setAlignmentData(data);
        
        // Direct mapping - the JSON already has word-level timestamps in milliseconds
        finalWords = data.map((item) => ({
          word: item.word,
          startMs: item.startMs,
          endMs: -1, // Not used
        }));
        
        console.log(`!!! Successfully loaded ${finalWords.length} words`);
        console.log(`!!! First word: "${finalWords[0]?.word}" at ${finalWords[0]?.startMs}ms`);
        console.log(`!!! Sample words:`, finalWords.slice(0, 5).map(w => `${w.word}@${w.startMs}ms`));
      } catch (error) {
        console.error('!!! FETCH ERROR:', error);
        
        // Fallback: Create dummy word map if fetch failed
        if (blessing?.text) {
          console.log('!!! FALLBACK: Creating dummy word map from blessing text');
          const words = blessing.text.split(/\s+/);
          let timeMs = 0;
          finalWords = words.map((word) => {
            const result = { word, startMs: timeMs, endMs: -1 };
            timeMs += 600;
            return result;
          });
          console.log(`!!! Dummy map created with ${finalWords.length} words`);
        }
      }
      
      setProcessedWords(finalWords);
      console.log('!!! FINAL processedWords length:', finalWords.length);
      setIsLoadingAlignment(false);
    };
    
    void fetchAlignment();
  }, [hasNarration, blessing, voicePreference]);

  const loadJournal = useCallback(async () => {
    try {
      const entry = await getDailyJournal({ dateKey: today, tribeId });
      const text = entry?.text ?? '';
      setText(text);
      setLastSavedText(text);
      setAudioClips(entry?.audioClips ?? []);
    } catch (error) {
      console.warn('Journal load failed:', error);
    }
  }, [today, tribeId]);

  const handleSaveJournal = useCallback(async () => {
    if (isSaving) {
      return;
    }
    try {
      setIsSaving(true);
      console.log('DEBUG: Journal save start', {
        dateKey: today,
        tribeId,
        textLen: text.length,
      });
      await upsertDailyJournal({
        dateKey: today,
        tribeId,
        text: text,
      });
      const readback = await getDailyJournal({ dateKey: today, tribeId });
      console.log('DEBUG: readback', {
        dateKey: today,
        tribeId,
        textLen: readback?.text?.length ?? null,
        updatedAt: readback?.updatedAt,
      });
      setLastSavedText(text);
      console.log('DEBUG: Journal save success', {
        dateKey: today,
        tribeId,
        textLen: text.length,
      });
      setSaveStatus('Saved ✓');
      if (saveStatusTimerRef.current) {
        clearTimeout(saveStatusTimerRef.current);
      }
      saveStatusTimerRef.current = setTimeout(() => {
        setSaveStatus(null);
      }, 1500);
    } catch (error) {
      console.warn('Journal save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, text, today, tribeId]);

  const handleStartRecording = useCallback(async () => {
    if (isRecording) {
      return;
    }
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        console.warn('Audio recording permission denied');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (error) {
      console.warn('Audio recording start failed:', error);
      setIsRecording(false);
      recordingRef.current = null;
    }
  }, [isRecording]);

  const handleStopRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) {
      return;
    }
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const durationMs = status.durationMillis ?? 0;
      if (!uri) {
        console.warn('Audio recording missing URI');
        return;
      }
      const clip: JournalAudioClip = {
        id: String(Date.now()),
        uri,
        durationMs,
        createdAt: new Date().toISOString(),
      };
      await addDailyJournalAudioClip({ dateKey: today, tribeId, clip });
      const updated = await getDailyJournal({ dateKey: today, tribeId });
      setAudioClips(updated?.audioClips ?? []);
    } catch (error) {
      console.warn('Audio recording stop failed:', error);
    } finally {
      setIsRecording(false);
      recordingRef.current = null;
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      } catch {
        // Ignore audio mode reset errors.
      }
    }
  }, [today, tribeId]);

  const handleTogglePlayback = useCallback(
    async (clip: JournalAudioClip) => {
      try {
        if (!playbackRef.current) {
          playbackRef.current = new Audio.Sound();
        }
        const sound = playbackRef.current;
        if (playingClipId === clip.id) {
          await sound.stopAsync();
          await sound.unloadAsync();
          setPlayingClipId(null);
          return;
        }
        setPlayingClipId(clip.id);
        await sound.unloadAsync().catch(() => undefined);
        await sound.loadAsync({ uri: clip.uri }, { shouldPlay: true });
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) {
            setPlayingClipId(null);
            sound.unloadAsync().catch(() => undefined);
          }
        });
        await sound.playAsync();
      } catch (error) {
        console.warn('Audio playback failed:', error);
        setPlayingClipId(null);
      }
    },
    [playingClipId]
  );

  const isDirty = text !== lastSavedText;
  const saveLabel = isSaving ? 'Saving…' : isDirty ? 'Save changes' : 'Saved';

  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current) {
        clearTimeout(saveStatusTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    const ensureCurrentTribe = async () => {
      try {
        const value = await getCurrentTribe();
        if (isActive) {
          setCurrentId(value);
        }
      } catch {
        if (isActive) {
          setCurrentId('1');
        }
      }
    };
    void ensureCurrentTribe();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    const loadSettings = async () => {
      try {
        const [monthValue, freeValue] = await Promise.all([
          getCurrentMonth(),
          getFreeMode(),
        ]);
        if (isActive) {
          setCurrentMonth(monthValue);
          setFreeModeState(freeValue);
        }
      } catch {
        if (isActive) {
          setCurrentMonth(1);
          setFreeModeState(false);
        }
      }
    };
    void loadSettings();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const preloadHeader = async () => {
      try {
        if (typeof headerSource === 'number') {
          await Asset.loadAsync([headerSource]);
        }
      } catch {
        // Ignore preload errors.
      }
    };
    void preloadHeader();
  }, [headerSource]);

  useEffect(() => {
    let isActive = true;
    const loadData = async () => {
      try {
        if (isActive) {
          const done = await getDailyCompletion(today, tribeId);
          const savedCount = await getReciteCount(today, tribeId);
          const clampedCount = Math.min(12, Math.max(0, savedCount));
          setCompletedToday(done);
          // If completed, lock at 12; otherwise use saved count
          setCount(done ? 12 : clampedCount);
        }
      } catch {
        if (isActive) {
          setCompletedToday(false);
          setCount(0);
        }
      } finally {
        if (isActive) {
          setHasLoadedCount(true);
        }
      }
    };
    void loadData();
    return () => {
      isActive = false;
    };
  }, [today, route.params.id]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const handleShow = (event: { endCoordinates: { height: number } }) => {
      setKeyboardHeight(event.endCoordinates.height);
    };
    const handleHide = () => {
      setKeyboardHeight(0);
    };
    const showSub = Keyboard.addListener(showEvent, handleShow);
    const hideSub = Keyboard.addListener(hideEvent, handleHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadJournal();
    }, [loadJournal])
  );

  // Persist recite count on change
  useEffect(() => {
    if (!hasLoadedCount || completedToday) {
      return;
    }
    const saveCount = async () => {
      try {
        await setReciteCount(today, tribeId, count);
      } catch {
        // Silently fail
      }
    };
    void saveCount();
  }, [count, today, tribeId, completedToday, hasLoadedCount]);

  const openExternal = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('Unable to open link');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link');
    }
  };

  const handleCompleteToday = async () => {
    try {
      await setDailyCompletion(today, tribeId);
      await setReciteCount(today, tribeId, 12);
      setCompletedToday(true);
      setCount(12);
    } catch {
      Alert.alert('Unable to save completion');
    }
  };

  const handleResetToday = async () => {
    try {
      await clearDailyCompletion(today, tribeId);
      await clearReciteCount(today, tribeId);
      setCompletedToday(false);
      setCount(0);
    } catch {
      Alert.alert('Unable to reset completion');
    }
  };

  const handleResetCount = async () => {
    try {
      await setReciteCount(today, tribeId, 0);
      setCount(0);
    } catch {
      Alert.alert('Unable to reset count');
    }
  };

  const handleToggleFreeMode = async (value: boolean) => {
    try {
      await setFreeMode(value);
      setFreeModeState(value);
    } catch {
      Alert.alert('Unable to update Free Mode');
    }
  };

  const toggleVoiceNarration = async () => {
    try {
      if (isVoiceNarrationPlaying) {
        // Stop voice narration
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        if (voiceNarrationRef.current) {
          await voiceNarrationRef.current.stopAsync();
          await voiceNarrationRef.current.unloadAsync();
          voiceNarrationRef.current = null;
        }
        setIsVoiceNarrationPlaying(false);
        currentWordIndexRef.current = -1;
        highlightedWordIndexRef.current = -1;
        setHighlightedWordIndex(-1);
      } else {
        // Start voice narration
        const { audioUrl } = getVoiceUrls();
        if (!audioUrl) {
          Alert.alert('Narration not available for selected voice');
          return;
        }
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, volume: 1.0 }
        );
        voiceNarrationRef.current = sound;
        setIsVoiceNarrationPlaying(true);
      }
    } catch (error) {
      console.warn('Voice narration error:', error);
      Alert.alert('Unable to play voice narration');
    }
  };

  // Memoized word component: prevents re-rendering unchanged words
  const WordComponent = React.memo<{ 
    word: string; 
    isHighlighted: boolean; 
    isLast: boolean;
  }>(({ word, isHighlighted, isLast }) => (
    <Text style={isHighlighted ? styles.highlightedWord : styles.normalWord}>
      {word}{!isLast ? ' ' : ''}
    </Text>
  ));

  const renderHighlightedText = () => {
    const text = blessing?.text ?? '';
    if (!processedWords || processedWords.length === 0) {
      return <Text style={styles.text}>{text}</Text>;
    }

    // Optimized rendering: no search, just use pre-calculated index
    const currentIndex = highlightedWordIndex;

    return (
      <Text style={styles.text}>
        {processedWords.map((wordObj, wordIndex) => {
          const { word } = wordObj;
          const isHighlighted = wordIndex === currentIndex;
          const isLast = wordIndex === processedWords.length - 1;

          return (
            <WordComponent
              key={wordIndex}
              word={word}
              isHighlighted={isHighlighted}
              isLast={isLast}
            />
          );
        })}
      </Text>
    );
  };

  /**
   * START-ONLY TRIGGER: Binary search for instant word highlighting.
   * Uses currentMs >= word.startMs as the ONLY condition.
   * No anchors, no offsets, no endMs checks.
   * @param status - Current playback status from expo-av
   * @param processedWords - Array of words with millisecond timestamps
   * @param currentIndexRef - Ref tracking last highlighted index (prevents redundant renders)
   * @param setHighlightedIndex - State setter for React re-render trigger
   */
  const syncHighlight = (
    status: any,
    processedWords: Array<{ word: string; startMs: number; endMs: number }>,
    currentIndexRef: React.MutableRefObject<number>,
    setHighlightedIndex: (index: number) => void
  ): void => {
    if (!status.isLoaded || !status.isPlaying) return;

    const currentMs = status.positionMillis;

    // Find the LAST word that has already started
    let low = 0, high = processedWords.length - 1, expectedIndex = -1;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (processedWords[mid].startMs <= currentMs) {
        expectedIndex = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    // Snap immediately if it's a new word
    if (expectedIndex !== -1 && expectedIndex !== currentIndexRef.current) {
      currentIndexRef.current = expectedIndex;
      setHighlightedIndex(expectedIndex);
      console.log(`[SYNC] Word: "${processedWords[expectedIndex].word}" | Audio: ${currentMs}ms | Target: ${processedWords[expectedIndex].startMs}ms`);
    }
  };

  // High-performance sync loop (60fps requestAnimationFrame)
  useEffect(() => {
    // Only run sync logic if audio is actively playing
    if (!isVoiceNarrationPlaying) {
      return;
    }
    
    if (voiceNarrationRef.current && processedWords.length > 0) {
      // requestAnimationFrame loop for instant updates
      const syncLoop = async () => {
        try {
          const status = await voiceNarrationRef.current?.getStatusAsync();
          if (status && status.isLoaded) {
            // Update audio position for external reference
            audioPositionRef.current = status.positionMillis || 0;
            
            // Call sync helper (instant clock + snap lookup)
            syncHighlight(
              status,
              processedWords,
              currentWordIndexRef,
              setHighlightedWordIndex
            );
            
            // Check if finished
            if (status.didJustFinish) {
              setIsVoiceNarrationPlaying(false);
              audioPositionRef.current = 0;
              currentWordIndexRef.current = -1;
              highlightedWordIndexRef.current = -1;
              setHighlightedWordIndex(-1);
              return; // Don't schedule next frame
            }
          }
        } catch (error) {
          // Silently handle errors
        }
        
        // Schedule next frame
        rafIdRef.current = requestAnimationFrame(syncLoop);
      };
      
      // Start the loop
      rafIdRef.current = requestAnimationFrame(syncLoop);
      
      return () => {
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      };
    }
  }, [isVoiceNarrationPlaying, processedWords.length]);

  // Cleanup voice narration on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (voiceNarrationRef.current) {
        voiceNarrationRef.current.stopAsync().catch(() => {});
        voiceNarrationRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const monthLabel = `Month ${currentMonth}`;
  const isLocked = !freeMode && blessing?.month !== monthLabel;

  return (
    <ScreenBackground tribeId={route.params.id} overlayOpacity={0.6}>
      <StatusBar barStyle="light-content" />
      <Screen style={styles.screen}>
        <KeyboardAvoidingView
          // Android keyboard avoidance can shrink the container; rely on ScrollView padding instead.
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
          style={styles.keyboardAvoiding}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: spacing.lg + 24 + keyboardHeight },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : undefined}
          >
            <View style={styles.header}>
              <View style={styles.headerImageFrame}>
                {headerSource ? (
                  <Image source={headerSource} style={styles.headerImage} resizeMode="contain" />
                ) : (
                  <View style={styles.headerPlaceholder} />
                )}
              </View>
              <View style={styles.titleRow}>
                <Text style={textStyles.title}>{blessing?.title ?? 'Blessing'}</Text>
                <Pressable
                  onPress={() => setMuted(!isMuted)}
                  style={styles.muteButton}
                  accessibilityRole="button"
                  accessibilityLabel={isMuted ? 'Unmute music' : 'Mute music'}
                >
                  <Ionicons
                    name={isMuted ? 'volume-mute' : 'volume-high'}
                    size={18}
                    color={colors.textPrimary}
                  />
                </Pressable>
              </View>
              {currentId === route.params.id ? <Pill label="Current Tribe" /> : null}
              {hasNarration ? renderHighlightedText() : (
                <Text style={styles.text}>{blessing?.text ?? 'Blessing not found.'}</Text>
              )}
            </View>

            <View style={styles.body}>
              <View style={styles.tabs}>
                <Pressable
                  style={[styles.tab, tab === 'recite' && styles.tabActive]}
                  onPress={() => setTab('recite')}
                  disabled={isAudioLoading}
                >
                  <Text style={styles.tabLabel}>
                    {isAudioLoading ? 'Loading...' : 'Recite'}
                  </Text>
                </Pressable>
                {hasNarration && (
                  <Pressable
                    style={[styles.tab, isVoiceNarrationPlaying && styles.tabActive]}
                    onPress={toggleVoiceNarration}
                    disabled={isLoadingAlignment}
                  >
                    {isLoadingAlignment ? (
                      <ActivityIndicator size="small" color="#FFD700" />
                    ) : (
                      <MaterialIcons
                        name="record-voice-over"
                        size={20}
                        color="#FFD700"
                      />
                    )}
                  </Pressable>
                )}
                <Pressable
                  style={[styles.tab, tab === 'inspiration' && styles.tabActive]}
                  onPress={() => setTab('inspiration')}
                >
                  <Text style={styles.tabLabel}>Inspiration</Text>
                </Pressable>
              </View>

              {tab === 'recite' ? (
                <Card>
                  {isLocked ? (
                    <Text style={styles.lockedText}>This blessing is for {monthLabel}.</Text>
                  ) : null}
                  <Text style={styles.counter}>{count}/12</Text>
                  {completedToday ? (
                    <Text style={styles.completedText}>Completed today</Text>
                  ) : null}
                  <PrimaryButton
                    title="Count"
                    onPress={() => setCount((prev) => (prev >= 12 ? 12 : prev + 1))}
                    disabled={completedToday || isLocked}
                  />
                  {!completedToday && count >= 12 && !isLocked ? (
                    <PrimaryButton title="Complete Today" onPress={handleCompleteToday} />
                  ) : null}
                  {!completedToday && count > 0 ? (
                    <SecondaryButton title="Reset count" onPress={handleResetCount} />
                  ) : null}
                  <InlineToggle label="Free Mode" value={freeMode} onChange={handleToggleFreeMode} />
                  <SecondaryButton title="Reset today (dev)" onPress={handleResetToday} />
                  <View
                    style={styles.journalBlock}
                    onLayout={(event) => setJournalLayoutY(event.nativeEvent.layout.y)}
                  >
                    <Text style={styles.journalLabel}>Journal (today)</Text>
                    <TextInput
                      value={text}
                      onChangeText={setText}
                      placeholder="Write a short reflection..."
                      placeholderTextColor={colors.muted}
                      style={styles.journalInput}
                      multiline
                      textAlignVertical="top"
                      onFocus={() => {
                        scrollViewRef.current?.scrollTo({
                          y: Math.max(journalLayoutY - 24, 0),
                          animated: true,
                        });
                      }}
                    />
                    <PrimaryButton
                      title={saveLabel}
                      onPress={handleSaveJournal}
                      disabled={!isDirty || isSaving}
                    />
                    {saveStatus ? (
                      <Text style={styles.saveStatus}>{saveStatus}</Text>
                    ) : null}
                    {isDirty ? (
                      <Text style={styles.unsavedHint}>Unsaved changes</Text>
                    ) : null}
                    <View style={styles.audioBlock}>
                      <Text style={styles.journalLabel}>Audio journal</Text>
                      {isRecording ? (
                        <Text style={styles.recordingIndicator}>Recording…</Text>
                      ) : null}
                      <PrimaryButton
                        title={isRecording ? 'Stop Recording' : 'Start Recording'}
                        onPress={isRecording ? handleStopRecording : handleStartRecording}
                      />
                      {audioClips.length === 0 ? (
                        <Text style={styles.audioHint}>No recordings yet.</Text>
                      ) : (
                        audioClips.map((clip) => (
                          <View key={clip.id} style={styles.audioRow}>
                            <Text style={styles.audioText}>
                              {Math.max(1, Math.round(clip.durationMs / 1000))}s
                            </Text>
                            <SecondaryButton
                              title={playingClipId === clip.id ? 'Pause' : 'Play'}
                              onPress={() => void handleTogglePlayback(clip)}
                            />
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                </Card>
              ) : (
                <View style={styles.inspirationContent}>
                  <Card>
                    <SectionHeader title="Scripture" />
                    {scriptures.length === 0 ? (
                      <Text style={styles.inspirationItem}>No items yet.</Text>
                    ) : (
                      <View style={styles.sectionGroup}>
                        {scriptures.map((item, index) => (
                          <View key={`${item.ref}-${index}`} style={styles.scriptureItem}>
                            <Text style={styles.scriptureRef}>{item.ref}</Text>
                            {item.text ? (
                              <Text style={styles.scriptureText}>{item.text}</Text>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    )}

                    <SectionHeader title="Videos" />
                    {videos.length === 0 ? (
                      <Text style={styles.inspirationItem}>No items yet.</Text>
                    ) : (
                      <View style={styles.sectionGroup}>
                        {videos.map((item, index) => (
                          <Pressable
                            key={`${item.title}-${index}`}
                            onPress={() => void openExternal(item.url)}
                            style={styles.linkRow}
                          >
                            <Text style={styles.linkItem}>{item.title}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}

                    <SectionHeader title="Songs" />
                    {songs.length === 0 ? (
                      <Text style={styles.inspirationItem}>No items yet.</Text>
                    ) : (
                      <View style={styles.sectionGroup}>
                        {songs.map((item, index) => (
                          <Pressable
                            key={`${item.title}-${index}`}
                            onPress={() => void openExternal(item.url)}
                            style={styles.linkRow}
                          >
                            <Text style={styles.linkItem}>
                              {item.title}
                              {item.artist ? ` - ${item.artist}` : ''}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </Card>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  screen: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  scrollView: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  headerImageFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    minHeight: 200,
    maxHeight: 310,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
  },
  titleRow: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 34,
  },
  muteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    position: 'absolute',
    right: 0,
  },
  text: {
    ...textStyles.body,
    includeFontPadding: false,
  },
  normalWord: {
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  highlightedWord: {
    color: '#FFD700',
    fontWeight: 'bold',
    includeFontPadding: false,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabLabel: {
    fontWeight: '600',
  },
  inspirationContent: {
    paddingBottom: spacing.lg,
  },
  counter: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  completedText: {
    color: colors.success,
    fontWeight: '600',
  },
  lockedText: {
    color: colors.warning,
    fontWeight: '600',
  },
  sectionGroup: {
    gap: spacing.sm,
  },
  scriptureItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scriptureRef: {
    ...textStyles.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  scriptureText: {
    ...textStyles.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  inspirationItem: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  linkRow: {
    paddingVertical: spacing.xs,
  },
  linkItem: {
    color: colors.accent,
    fontWeight: '600',
  },
  journalBlock: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  journalLabel: {
    ...textStyles.label,
  },
  journalInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  saveStatus: {
    ...textStyles.label,
    color: colors.success,
  },
  unsavedHint: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  audioBlock: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  audioText: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  audioHint: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  recordingIndicator: {
    ...textStyles.label,
    color: colors.warning,
  },
});
