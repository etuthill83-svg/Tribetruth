import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, textStyles } from '../theme/theme';

type Props = {
  label: string;
  style?: ViewStyle;
};

export default function Pill({ label, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: '#eef7ee',
  },
  text: {
    ...textStyles.label,
    color: colors.success,
  },
});
