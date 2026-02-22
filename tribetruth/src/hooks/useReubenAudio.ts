import { useEffect, useRef, useContext, useState } from 'react';
import { Audio } from 'expo-av';
import MusicContext from '../context/MusicContext';

export function useReubenAudio(audioUrl?: string) {
  const soundRef = useRef<Audio.Sound>(new Audio.Sound());
  const { isMuted, setThemeSuppressed } = useContext(MusicContext);
  const setThemeSuppressedRef = useRef(setThemeSuppressed);
  const isMountedRef = useRef(true);
  const didSuppressThemeRef = useRef(false);
  const lastPlayRef = useRef<boolean | null>(null);
  const lastMutedRef = useRef<boolean | null>(null);
  const [isAudioReady, setAudioReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);
  const isLoadedRef = useRef(false);
  const currentUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setThemeSuppressedRef.current = setThemeSuppressed;
  }, [setThemeSuppressed]);

  useEffect(() => {
    let canceled = false;
    const loadSound = async () => {
      // Don't load if no URL provided or already loading the same URL
      if (!audioUrl || isLoadingRef.current || (isLoadedRef.current && currentUrlRef.current === audioUrl)) {
        return;
      }

      // Unload previous audio if URL changed
      if (isLoadedRef.current && currentUrlRef.current !== audioUrl) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch {
          // Ignore cleanup errors
        }
        isLoadedRef.current = false;
        setAudioReady(false);
      }

      isLoadingRef.current = true;
      setIsLoading(true);
      currentUrlRef.current = audioUrl;

      try {
        console.log(`DEBUG: Starting Load for audio: ${audioUrl}`);
        const sound = soundRef.current;
        await sound.loadAsync({ uri: audioUrl }, { isLooping: false, volume: 1.0 });
        console.log(`DEBUG: Load Success for audio: ${audioUrl}`);
        if (canceled || !isMountedRef.current) {
          await sound.unloadAsync();
          isLoadingRef.current = false;
          setIsLoading(false);
          return;
        }
        isLoadedRef.current = true;
        setAudioReady(true);
        setIsLoading(false);
      } catch (error) {
        console.warn('Failed to load tribe blessing audio:', error);
        setAudioReady(false);
        setIsLoading(false);
        isLoadedRef.current = false;
      } finally {
        isLoadingRef.current = false;
      }
    };

    const unloadSound = async () => {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {
        // Ignore cleanup errors
      }
      setAudioReady(false);
      setIsLoading(false);
      isLoadingRef.current = false;
      isLoadedRef.current = false;
      currentUrlRef.current = undefined;
    };

    if (audioUrl) {
      void loadSound();
    } else {
      void unloadSound();
      if (didSuppressThemeRef.current) {
        setThemeSuppressedRef.current(false);
        didSuppressThemeRef.current = false;
      }
    }

    return () => {
      canceled = true;
      void unloadSound();
      if (didSuppressThemeRef.current) {
        setThemeSuppressedRef.current(false);
        didSuppressThemeRef.current = false;
      }
    };
  }, [audioUrl]);

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
      if (!audioUrl) {
        return;
      }

      const shouldPlay = !isMuted;
      const desiredMuted = isMuted;

      if (!isAudioReady || !isLoadedRef.current) {
        return;
      }

      if (shouldPlay && !didSuppressThemeRef.current) {
        setThemeSuppressedRef.current(true);
        didSuppressThemeRef.current = true;
      }

      try {
        if (lastMutedRef.current !== desiredMuted) {
          await sound.setIsMutedAsync(desiredMuted);
          lastMutedRef.current = desiredMuted;
        }
        if (lastPlayRef.current !== shouldPlay) {
          if (shouldPlay) {
            await sound.playAsync();
          } else {
            await sound.pauseAsync();
          }
          lastPlayRef.current = shouldPlay;
        }
      } catch (error) {
        console.warn('Failed to sync tribe blessing audio:', error);
      }
    };

    void syncPlayback();
  }, [audioUrl, isMuted, isAudioReady]);

  return { isLoading, isAudioReady };
}
