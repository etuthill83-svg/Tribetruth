import { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

export default function Screen({ children, style }: Props) {
  return <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
});
