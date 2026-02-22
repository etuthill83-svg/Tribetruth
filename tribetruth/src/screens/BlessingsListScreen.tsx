import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { getCurrentMonth, getCurrentTribe } from '../storage/storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import blessingsData from '../data/blessings.json';
import Screen from '../components/Screen';
import Card from '../components/Card';
import InlineToggle from '../components/InlineToggle';
import { colors, spacing, textStyles } from '../theme/theme';
import tribeImages from '../data/tribeImages';
import ScreenBackground from '../components/ScreenBackground';

type Props = NativeStackScreenProps<RootStackParamList, 'BlessingsList'>;

type Blessing = {
  id: string;
  tribe: string;
  month: string;
  title: string;
  text: string;
};

const blessings = blessingsData as Blessing[];
const MONTHS = [
  'Month 1',
  'Month 2',
  'Month 3',
  'Month 4',
  'Month 5',
  'Month 6',
  'Month 7',
  'Month 8',
  'Month 9',
  'Month 10',
  'Month 11',
  'Month 12',
];

export default function BlessingsListScreen({ navigation }: Props) {
  const [currentId, setCurrentId] = useState<string>('1');
  const [currentMonth, setCurrentMonth] = useState(1);
  const [showCurrentOnly, setShowCurrentOnly] = useState(false);

  const filteredBlessings = useMemo(() => {
    if (!showCurrentOnly) {
      return blessings;
    }
    return blessings.filter((item) => item.month === MONTHS[currentMonth - 1]);
  }, [currentMonth, showCurrentOnly]);

  useEffect(() => {
    let isActive = true;
    const loadCurrent = async () => {
      try {
        const [tribeValue, monthValue] = await Promise.all([
          getCurrentTribe(),
          getCurrentMonth(),
        ]);
        if (isActive) {
          setCurrentId(tribeValue);
          setCurrentMonth(monthValue);
        }
      } catch {
        if (isActive) {
          setCurrentId('1');
          setCurrentMonth(1);
        }
      }
    };
    void loadCurrent();
    return () => {
      isActive = false;
    };
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Blessing }) => {
      const isCurrent = item.id === currentId;
      const isMonthMatch = item.month === MONTHS[currentMonth - 1];
      const imageSet = tribeImages[item.id];
      const thumbSource = imageSet?.thumb;
      return (
        <Pressable
          style={styles.cardWrapper}
          onPress={() => navigation.navigate('BlessingDetail', { id: item.id })}
        >
          <Card
            style={[
              styles.card,
              isCurrent && styles.cardCurrent,
              isMonthMatch && styles.cardMonth,
            ]}
          >
            <View style={styles.row}>
                  <View style={styles.thumbFrame}>
                    {thumbSource ? (
                      <Image source={thumbSource} style={styles.thumbImage} resizeMode="contain" />
                    ) : (
                      <View style={styles.thumbPlaceholder} />
                    )}
                  </View>
              <View style={styles.textBlock}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>
                  {item.tribe} • {item.month}
                </Text>
                {isCurrent ? <Text style={styles.currentTag}>Current tribe</Text> : null}
              </View>
            </View>
          </Card>
        </Pressable>
      );
    },
    [currentId, currentMonth, navigation]
  );

  return (
    <ScreenBackground tribeId={currentId} overlayOpacity={0.55}>
      <StatusBar barStyle="light-content" />
      <Screen style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.list}
        data={filteredBlessings}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <Card style={styles.headerCard}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>Blessings</Text>
              <Text style={styles.headerSubtitle}>
                Current month: {MONTHS[currentMonth - 1]}
              </Text>
            </View>
            <InlineToggle
              label="Show current month only"
              value={showCurrentOnly}
              onChange={setShowCurrentOnly}
            />
          </Card>
        }
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      </Screen>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: spacing.xl,
  },
  screen: {
    backgroundColor: 'transparent',
  },
  headerCard: {
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  headerTextGroup: {
    gap: spacing.xs,
  },
  headerTitle: {
    ...textStyles.subtitle,
    color: '#000000',
  },
  headerSubtitle: {
    ...textStyles.body,
    color: '#000000',
  },
  cardWrapper: {
    borderRadius: 12,
  },
  card: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumbFrame: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: colors.border,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  cardCurrent: {
    borderColor: colors.success,
    backgroundColor: '#f5fbf5',
  },
  cardMonth: {
    borderColor: colors.accent,
  },
  title: {
    ...textStyles.subtitle,
    color: '#000000',
  },
  meta: {
    ...textStyles.body,
    color: '#000000',
  },
  currentTag: {
    ...textStyles.label,
    color: '#000000',
  },
  separator: {
    height: spacing.md,
  },
});
