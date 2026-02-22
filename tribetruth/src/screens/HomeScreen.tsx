import { ImageBackground, Pressable, StyleSheet, Text, View, StatusBar } from 'react-native';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getCurrentTribe } from '../storage/storage';
import Screen from '../components/Screen';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, textStyles } from '../theme/theme';
import MusicContext from '../context/MusicContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const VIDEO_URL = 'https://pub-28a96ef5d275416ea27ae14f6e84c132.r2.dev/official/video/general/homescreen9x16.mp4';

export default function HomeScreen({ navigation }: Props) {
  const { isMuted, toggleMuted } = useContext(MusicContext);
  const isFocused = useIsFocused();
  const videoRef = useRef<Video>(null);
  const [currentTribeId, setCurrentTribeId] = useState('1');
  const [videoError, setVideoError] = useState(false);
  const fallbackBackground = useMemo(
    () => require('../../assets/splash-icon.png'),
    []
  );

  useEffect(() => {
    let isActive = true;
    const loadData = async () => {
      try {
        const tribeValue = await getCurrentTribe();
        if (isActive) {
          setCurrentTribeId(tribeValue);
        }
      } catch {
        if (isActive) {
          setCurrentTribeId('1');
        }
      }
    };
    void loadData();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const manageVideo = async () => {
      if (!videoRef.current) return;
      try {
        if (isFocused) {
          await videoRef.current.playAsync();
        } else {
          await videoRef.current.pauseAsync();
        }
      } catch {
        // Ignore playback control errors
      }
    };
    void manageVideo();
  }, [isFocused]);

  const handleVideoError = () => {
    setVideoError(true);
  };

  const handleVideoLoad = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setVideoError(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFillObject}>
        {videoError ? (
          <ImageBackground source={fallbackBackground} style={styles.bg} resizeMode="cover">
            <View style={styles.bgOverlay} pointerEvents="none" />
          </ImageBackground>
        ) : (
          <>
            <Video
              ref={videoRef}
              source={{ uri: VIDEO_URL }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              shouldPlay={true}
              isLooping={true}
              isMuted={true}
              onError={handleVideoError}
              onLoad={handleVideoLoad}
            />
            <View style={styles.bgOverlay} pointerEvents="none" />
          </>
        )}
      </View>
      <Screen style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            onPress={toggleMuted}
            style={styles.musicButton}
            accessibilityRole="button"
            accessibilityLabel={isMuted ? 'Unmute music' : 'Mute music'}
          >
            <MaterialIcons
              name={isMuted ? 'volume-off' : 'volume-up'}
              size={22}
              color="#FFD700"
            />
          </Pressable>
        </View>

        <View style={styles.centeredContent}>
          <Text style={styles.mainTitle}>TribeTruth</Text>
          <View style={styles.actions}>
            <PrimaryButton
              title="Blessings"
              onPress={() => navigation.navigate('BlessingsList')}
            />
            <PrimaryButton
              title="Progress"
              onPress={() => navigation.navigate('Progress')}
            />
            <PrimaryButton
              title="Settings"
              onPress={() => navigation.navigate('Settings')}
            />
          </View>
          <Text style={styles.footerText}>Daily path through the tribes</Text>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'flex-end',
    paddingTop: spacing.xs,
    paddingBottom: 0,
    marginBottom: 0,
    backgroundColor: 'transparent',
  },
  bg: {
    flex: 1,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  screen: {
    backgroundColor: 'transparent',
  },
  musicButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 36,
    letterSpacing: 1.5,
    color: '#FFFFFF',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.md,
    width: '100%',
    maxWidth: 300,
  },
  footerText: {
    fontFamily: 'serif',
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#FFD700',
    fontSize: 16,
    marginTop: 40,
    textAlign: 'center',
  },
});
