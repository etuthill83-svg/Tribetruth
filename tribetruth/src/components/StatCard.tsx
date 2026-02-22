import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Card from './Card';
import { colors, spacing, textStyles } from '../theme/theme';

type Props = {
  label: string;
  value: string;
  style?: ViewStyle;
};

export default function StatCard({ label, value, style }: Props) {
  return (
    <Card style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
