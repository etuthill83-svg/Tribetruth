import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '../theme/theme';

type Props = {
  source: ImageSourcePropType | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  placeholderColor?: string;
};

export default function SmartImage({
  source,
  style,
  resizeMode = 'cover',
  placeholderColor = colors.border,
}: Props) {
  const [isLoaded, setLoaded] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLoaded(false);
    opacity.setValue(0);
  }, [source, opacity]);

  const containerStyle = useMemo(() => [styles.container, style], [style]);

  if (!source) {
    return <View style={[containerStyle, { backgroundColor: placeholderColor }]} />;
  }

  const handleLoadEnd = () => {
    setLoaded(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={containerStyle}>
      {!isLoaded ? (
        <View style={[StyleSheet.absoluteFillObject, styles.placeholder]}>
          <ActivityIndicator color={colors.textSecondary} />
        </View>
      ) : null}
      <Animated.Image
        source={source}
        style={[StyleSheet.absoluteFillObject, { opacity }]}
        resizeMode={resizeMode}
        onLoadEnd={handleLoadEnd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
  },
});
