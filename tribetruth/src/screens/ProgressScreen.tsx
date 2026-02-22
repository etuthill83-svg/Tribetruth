import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import {
  clearProgress,
  getCurrentMonth,
  getDailyCompletions,
  getLocalYMD,
  setCurrentMonth,
} from '../storage/storage';
import blessingsData from '../data/blessings.json';
import Screen from '../components/Screen';
import Card from '../components/Card';
import SecondaryButton from '../components/SecondaryButton';
import StatCard from '../components/StatCard';
import SectionHeader from '../components/SectionHeader';
import Tile from '../components/Tile';
import { colors, spacing, textStyles } from '../theme/theme';

type DayCompletion = {
  date: string;
  completed: boolean;
};

type Blessing = {
  id: string;
  tribe: string;
  month: string;
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

function buildDateList(days: number, today: Date): string[] {
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(getLocalYMD(d));
  }
  return dates;
}

function computeStreaks(
  completedDates: Set<string>,
  today: Date
): { current: number; longest: number } {
  let current = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = getLocalYMD(d);
    if (completedDates.has(dateStr)) {
      current++;
    } else {
      break;
    }
  }

  let longest = 0;
  let tempStreak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = getLocalYMD(d);
    if (completedDates.has(dateStr)) {
      tempStreak++;
      longest = Math.max(longest, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return { current, longest };
}

export default function ProgressScreen() {
  const [completedToday, setCompletedToday] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [last30Days, setLast30Days] = useState<DayCompletion[]>([]);
  const [currentMonth, setMonth] = useState(1);

  const currentMonthTribe = useMemo(() => {
    const monthLabel = MONTHS[currentMonth - 1];
    return blessings.find((item) => item.month === monthLabel)?.tribe ?? 'Unknown';
  }, [currentMonth]);

  const loadProgress = useCallback(async () => {
    try {
      const today = new Date();
      const last60Dates = buildDateList(60, today);
      const last60Set = new Set(last60Dates);
      const allCompleted = await getDailyCompletions();
      const completedDates = new Set<string>();
      allCompleted.forEach((date) => {
        if (last60Set.has(date)) {
          completedDates.add(date);
        }
      });

      const todayStr = getLocalYMD(today);
      setCompletedToday(completedDates.has(todayStr));

      const daysList: DayCompletion[] = [];
      const last30Dates = last60Dates.slice(0, 30);
      for (const dateStr of last30Dates) {
        daysList.push({
          date: dateStr,
          completed: completedDates.has(dateStr),
        });
      }
      setLast30Days(daysList);

      const streaks = computeStreaks(completedDates, today);
      setCurrentStreak(streaks.current);
      setLongestStreak(streaks.longest);
    } catch {
      setCompletedToday(false);
      setCurrentStreak(0);
      setLongestStreak(0);
      setLast30Days([]);
    }
  }, []);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    let isActive = true;
    const loadHeader = async () => {
      try {
        const monthValue = await getCurrentMonth();
        if (isActive) {
          setMonth(monthValue);
        }
      } catch {
        if (isActive) {
          setMonth(1);
        }
      }
    };
    void loadHeader();
    return () => {
      isActive = false;
    };
  }, []);

  const handlePrevMonth = async () => {
    if (currentMonth <= 1) {
      return;
    }
    const next = currentMonth - 1;
    setMonth(next);
    await setCurrentMonth(next);
  };

  const handleNextMonth = async () => {
    if (currentMonth >= 12) {
      return;
    }
    const next = currentMonth + 1;
    setMonth(next);
    await setCurrentMonth(next);
  };

  const handleClearProgress = async () => {
    try {
      await clearProgress();
      await loadProgress();
    } catch {
      // Silently fail in debug only
    }
  };

  return (
    <Screen>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <View style={styles.monthRow}>
            <SecondaryButton
              title="Prev"
              onPress={handlePrevMonth}
              disabled={currentMonth <= 1}
            />
            <View style={styles.monthInfo}>
              <Text style={styles.monthLabel}>{MONTHS[currentMonth - 1]}</Text>
              <Text style={styles.tribeLabel}>{currentMonthTribe}</Text>
            </View>
            <SecondaryButton
              title="Next"
              onPress={handleNextMonth}
              disabled={currentMonth >= 12}
            />
          </View>
        </Card>

        <View style={styles.statsGrid}>
          <StatCard
            label="Completed Today"
            value={completedToday ? 'Yes' : 'No'}
          />
          <StatCard label="Current Streak" value={`${currentStreak} days`} />
          <StatCard label="Longest Streak" value={`${longestStreak} days`} />
        </View>

        <SectionHeader title="Last 30 Days" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tilesRow}>
            {last30Days.map((day, index) => (
              <Tile
                key={day.date}
                label={day.date.slice(5)}
                checked={day.completed}
                highlight={index === 0}
              />
            ))}
          </View>
        </ScrollView>

        {__DEV__ ? (
          <Pressable style={styles.debugButton} onPress={handleClearProgress}>
            <Text style={styles.debugButtonText}>Debug: clear all progress</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  monthInfo: {
    alignItems: 'center',
    minWidth: 140,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tribeLabel: {
    marginTop: spacing.xs,
    ...textStyles.body,
  },
  statsGrid: {
    gap: spacing.md,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  debugButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  debugButtonText: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
});
