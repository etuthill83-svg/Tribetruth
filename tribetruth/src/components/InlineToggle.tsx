import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme/theme';

type Props = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export default function InlineToggle({ label, value, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
});
