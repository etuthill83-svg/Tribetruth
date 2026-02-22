import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, textStyles } from '../theme/theme';

type Props = {
  label: string;
  checked?: boolean;
  highlight?: boolean;
};

export default function Tile({ label, checked, highlight }: Props) {
  return (
    <View style={[styles.tile, highlight && styles.highlight]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.check}>{checked ? '✓' : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 64,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  highlight: {
    borderColor: colors.success,
  },
  label: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  check: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
});
