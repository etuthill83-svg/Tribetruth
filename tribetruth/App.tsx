import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import MusicContext from './src/context/MusicContext';
import tribeImages from './src/data/tribeImages';

const THEME_AUDIO_URL = 'https://pub-28a96ef5d275416ea27ae14f6e84c132.r2.dev/official/audio/general/Twelve%20blessings%20theme%20Shorter.mp3';

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const soundRef = useRef<Audio.Sound>(new Audio.Sound());
  const lastMutedRef = useRef<boolean | null>(null);
  const isLoadingRef = useRef(false);
  const isLoadedRef = useRef(false);
  const shouldUnloadRef = useRef(false);
  const isMountedRef = useRef(true);
  const audioPrepRef = useRef<Promise<void> | null>(null);
  const activeRouteRef = useRef<string | undefined>(undefined);
  const isMutedRef = useRef(false);
  const isThemeSuppressedRef = useRef(false);
  const [isMuted, setMuted] = useState(false);
  const [isThemeSuppressed, setThemeSuppressed] = useState(false);
  const [activeRoute, setActiveRoute] = useState<string | undefined>();
  const [isAudioReady, setAudioReady] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const preloadImages = async () => {
      try {
        const assets = Object.values(tribeImages)
          .flatMap((set) => [set.background, set.hero, set.header])
          .filter(Boolean) as number[];
        if (assets.length > 0) {
          await Asset.loadAsync(assets);
        }
      } catch {
        // Ignore preload errors.
      }
    };
    void preloadImages();
  }, []);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isThemeSuppressedRef.current = isThemeSuppressed;
  }, [isThemeSuppressed]);

  const ensureAudioPrepared = useCallback(async () => {
    if (!audioPrepRef.current) {
      audioPrepRef.current = (async () => {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
      })();
    }
    return audioPrepRef.current;
  }, []);

  useEffect(() => {
    void ensureAudioPrepared();
  }, [ensureAudioPrepared]);

  useEffect(() => {
    void loadSound();
  }, []);

  const loadSound = async () => {
    if (isLoadingRef.current || isLoadedRef.current) {
      return;
    }
    try {
      isLoadingRef.current = true;
      await ensureAudioPrepared();
      console.log('DEBUG: Starting Load for streaming theme audio (Shorter MP3):', THEME_AUDIO_URL);
      await soundRef.current.loadAsync(
        { uri: THEME_AUDIO_URL },
        { isLooping: true, volume: 1.0, shouldPlay: false },
        false
      );
      console.log('DEBUG: Load Success for streaming theme audio (Shorter MP3)');
      if (!isMountedRef.current) {
        await soundRef.current.unloadAsync();
        isLoadingRef.current = false;
        return;
      }
      if (shouldUnloadRef.current) {
        await soundRef.current.unloadAsync();
        isLoadingRef.current = false;
        isLoadedRef.current = false;
        shouldUnloadRef.current = false;
        setAudioReady(false);
        return;
      }
      isLoadedRef.current = true;
      setAudioReady(true);
      if (!isMutedRef.current && activeRouteRef.current === 'Home' && !isThemeSuppressedRef.current) {
        await soundRef.current.playAsync();
      }
      isLoadingRef.current = false;
    } catch (error) {
      console.warn('Failed to load theme audio:', error);
      setAudioReady(false);
      isLoadingRef.current = false;
      isLoadedRef.current = false;
    }
  };

  const unloadSound = async () => {
    if (isLoadingRef.current) {
      shouldUnloadRef.current = true;
      return;
    }
    if (!isLoadedRef.current) {
      return;
    }
    try {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
    } catch {
      // Ignore unload errors.
    }
    isLoadedRef.current = false;
    isLoadingRef.current = false;
    setAudioReady(false);
  };

  useEffect(() => {
    if (activeRoute === 'Home') {
      if (isThemeSuppressedRef.current) {
        setThemeSuppressed(false);
      }
      void loadSound();
    }
  }, [activeRoute]);

  useEffect(() => {
    const syncMute = async () => {
      if (!isAudioReady || !isLoadedRef.current) {
        return;
      }
      console.log('DEBUG: Mute state changed to:', isMuted);
      try {
        await soundRef.current.setIsMutedAsync(isMuted);
      } catch {
        // Ignore mute errors.
      }
    };
    void syncMute();
  }, [isMuted, isAudioReady]);

  useEffect(() => {
    const syncPlayback = async () => {
      const sound = soundRef.current;
      if (!activeRoute || !isAudioReady || !isLoadedRef.current) {
        return;
      }
      const shouldPlay = activeRoute === 'Home' && !isMuted && !isThemeSuppressed;
      const shouldStop = activeRoute === 'BlessingDetail' || isThemeSuppressed || isMuted;
      const desiredMuted = !shouldPlay;
      try {
        if (lastMutedRef.current !== desiredMuted) {
          await sound.setIsMutedAsync(desiredMuted);
          lastMutedRef.current = desiredMuted;
        }
        if (shouldStop) {
          await sound.stopAsync();
          return;
        }
        if (shouldPlay) {
          await sound.playAsync();
        } else {
          await sound.pauseAsync();
        }
      } catch {
        // Ignore playback errors.
      }
    };
    void syncPlayback();
  }, [activeRoute, isMuted, isThemeSuppressed, isAudioReady]);

  useEffect(() => {
    const autoStart = async () => {
      if (!isAudioReady || !isLoadedRef.current) {
        return;
      }
      const shouldPlay = activeRoute === 'Home' && !isMuted && !isThemeSuppressed;
      if (!shouldPlay) {
        return;
      }
      try {
        await soundRef.current.playAsync();
      } catch {
        // Ignore playback errors.
      }
    };
    void autoStart();
  }, [activeRoute, isMuted, isThemeSuppressed, isAudioReady]);

  const contextValue = useMemo(() => {
    const setMutedSafe = (value: boolean) => {
      setMuted((prev) => (prev === value ? prev : value));
    };
    const setThemeSuppressedSafe = (value: boolean) => {
      setThemeSuppressed((prev) => (prev === value ? prev : value));
    };
    return {
      isMuted,
      setMuted: setMutedSafe,
      toggleMuted: () => setMutedSafe(!isMuted),
      isThemeSuppressed,
      setThemeSuppressed: setThemeSuppressedSafe,
    };
  }, [isMuted, isThemeSuppressed]);

  const handleStateChange = () => {
    const route = navigationRef.getCurrentRoute()?.name;
    activeRouteRef.current = route;
    setActiveRoute(route);
  };

  return (
    <SafeAreaProvider>
      <MusicContext.Provider value={contextValue}>
        <NavigationContainer
          ref={navigationRef}
          onReady={handleStateChange}
          onStateChange={handleStateChange}
        >
          <AppNavigator />
        </NavigationContainer>
      </MusicContext.Provider>
    </SafeAreaProvider>
  );
}
