import { ReactNode, useMemo } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import tribeBackgrounds from '../assets/tribeBackgrounds';

type Props = {
  tribeId: string;
  overlayOpacity?: number;
  children: ReactNode;
};

export default function ScreenBackground({
  tribeId,
  overlayOpacity = 0.35,
  children,
}: Props) {
  const source = useMemo(
    () => tribeBackgrounds[tribeId] ?? tribeBackgrounds.fallback,
    [tribeId]
  );

  return (
    <View style={styles.container}>
      <View
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
        shouldRasterizeIOS
        renderToHardwareTextureAndroid
      >
        <ImageBackground source={source} style={StyleSheet.absoluteFillObject} resizeMode="cover">
          <View
            style={[
              styles.overlay,
              { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` },
            ]}
          />
        </ImageBackground>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
});
