import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '@/src/theme';
import type { Timer, QuickStartItem, ActiveTimer } from '@/src/types';

const DEFAULT_QUICK_STARTS: QuickStartItem[] = [
  { id: 'qs1', name: 'Break', duration: 300, icon: 'cafe-outline' },
  { id: 'qs2', name: 'Focus', duration: 1500, icon: 'bulb-outline' },
  { id: 'qs3', name: 'Reading', duration: 2700, icon: 'book-outline' },
  { id: 'qs4', name: 'HIIT', duration: 600, icon: 'barbell-outline' },
];

const DEFAULT_TIMERS: Timer[] = [
  { id: 't1', name: 'Code Refactor', duration: 3600, icon: 'code-slash-outline', category: 'Focus', type: 'interval', createdAt: new Date().toISOString() },
  { id: 't2', name: 'Meditation', duration: 900, icon: 'leaf-outline', category: 'Health', type: 'single', createdAt: new Date().toISOString() },
  { id: 't3', name: 'Email Blitz', duration: 1200, icon: 'mail-outline', category: 'Admin', type: 'single', createdAt: new Date().toISOString() },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDurationLabel(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return `${m.toString().padStart(2, '0')}:00`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [timers, setTimers] = useState<Timer[]>(DEFAULT_TIMERS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ringOffset, setRingOffset] = useState(283);

  // Load timers from storage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('timers');
        if (stored) setTimers(JSON.parse(stored));
        const active = await AsyncStorage.getItem('activeTimer');
        if (active) setActiveTimer(JSON.parse(active));
      } catch {}
    })();
  }, []);

  // Tick active timer
  useEffect(() => {
    if (activeTimer?.isRunning && activeTimer.remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setActiveTimer((prev) => {
          if (!prev || prev.remainingSeconds <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (prev) {
              AsyncStorage.removeItem('activeTimer');
            }
            return null;
          }
          const updated = { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
          AsyncStorage.setItem('activeTimer', JSON.stringify(updated));
          return updated;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTimer?.isRunning]);

  // Animate ring
  useEffect(() => {
    if (activeTimer && activeTimer.totalDuration > 0) {
      const progress = activeTimer.remainingSeconds / activeTimer.totalDuration;
      setRingOffset(283 * progress);
    }
  }, [activeTimer?.remainingSeconds]);

  const startTimer = useCallback(async (name: string, duration: number) => {
    const now = new Date();
    const timer: ActiveTimer = {
      timerId: name,
      name,
      totalDuration: duration,
      remainingSeconds: duration,
      isRunning: true,
      startedAt: now.toISOString(),
    };
    setActiveTimer(timer);
    await AsyncStorage.setItem('activeTimer', JSON.stringify(timer));
  }, []);

  const getEndTime = useCallback(() => {
    if (!activeTimer) return '';
    const now = new Date();
    const end = new Date(now.getTime() + activeTimer.remainingSeconds * 1000);
    return end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }, [activeTimer]);

  return (
    <View className="flex-1 bg-red-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 pb-4 pt-2 flex-row items-center justify-between bg-white/80">
        <View>
          <Text className="text-xs font-bold uppercase tracking-widest text-red-600">Implement It</Text>
          <Text className="text-xl font-bold text-gray-900">Focus Hub</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.75}
          className="w-10 h-10 rounded-full bg-red-100 items-center justify-center"
        >
          <Ionicons name="person" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Active Timer */}
        {activeTimer ? (
          <Animated.View entering={FadeInDown.duration(400)} className="mt-4">
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => router.push('/customizable_countdown_and_interval_timers_with_alerts')}
            >
              <LinearGradient
                colors={['#EF4444', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-3xl p-6 shadow-xl"
                style={{ shadowColor: '#FCA5A5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }}
              >
                <View className="flex-row justify-between items-start mb-8">
                  <View>
                    <View className="bg-white/20 px-3 py-1 rounded-full self-start mb-1">
                      <Text className="text-white text-[10px] font-bold uppercase tracking-wider">Running Now</Text>
                    </View>
                    <Text className="text-2xl font-bold text-white">{activeTimer.name}</Text>
                  </View>
                  <View className="w-12 h-12 items-center justify-center">
                    <Svg width={48} height={48} style={{ transform: [{ rotate: '-90deg' }] }}>
                      <Circle cx={24} cy={24} r={20} stroke="rgba(255,255,255,0.2)" strokeWidth={4} fill="none" />
                      <Circle
                        cx={24} cy={24} r={20}
                        stroke="white" strokeWidth={4} fill="none"
                        strokeDasharray={283}
                        strokeDashoffset={283 - ringOffset}
                        strokeLinecap="round"
                      />
                    </Svg>
                    <View className="absolute">
                      <Ionicons name="play" size={16} color="white" />
                    </View>
                  </View>
                </View>
                <View className="flex-row items-end justify-between">
                  <Text className="text-5xl font-light text-white tracking-tight" style={{ fontVariant: ['tabular-nums'] }}>
                    {formatTime(activeTimer.remainingSeconds)}
                  </Text>
                  <Text className="text-white/80 text-sm">Ends at {getEndTime()}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400)} className="mt-4">
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => startTimer('Deep Work', 1500)}
            >
              <LinearGradient
                colors={['#EF4444', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-3xl p-6"
                style={{ shadowColor: '#FCA5A5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }}
              >
                <View className="items-center py-4">
                  <Ionicons name="play-circle" size={56} color="white" />
                  <Text className="text-white text-lg font-bold mt-3">Tap to Start Deep Work</Text>
                  <Text className="text-white/70 text-sm mt-1">25:00 focus session</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Quick Start */}
        <View className="mt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-bold text-gray-800 text-base">Quick Start</Text>
            <TouchableOpacity activeOpacity={0.75}>
              <Text className="text-sm font-semibold text-red-600">Edit</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-4">
            {DEFAULT_QUICK_STARTS.map((qs, i) => (
              <Animated.View key={qs.id} entering={FadeInDown.delay(i * 80).duration(300)} className="w-[47%]">
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => startTimer(qs.name, qs.duration)}
                  className="bg-white/90 border border-red-100 p-4 rounded-2xl items-center"
                  style={{ gap: 12 }}
                >
                  <View className="w-12 h-12 bg-red-100 rounded-xl items-center justify-center">
                    <Ionicons name={qs.icon as any} size={24} color={theme.colors.primary} />
                  </View>
                  <View className="items-center">
                    <Text className="font-bold text-gray-800">{qs.name}</Text>
                    <Text className="text-xs text-gray-500">{formatDurationLabel(qs.duration)}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Your Timers */}
        <View className="mt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-bold text-gray-800 text-base">Your Timers</Text>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push('/customizable_countdown_and_interval_timers_with_alerts')}
              className="flex-row items-center"
              style={{ gap: 4 }}
            >
              <Ionicons name="add" size={16} color={theme.colors.primary} />
              <Text className="text-sm font-semibold text-red-600">New</Text>
            </TouchableOpacity>
          </View>
          <View style={{ gap: 12 }}>
            {timers.map((t, i) => (
              <Animated.View key={t.id} entering={FadeInDown.delay(i * 60).duration(300)}>
                <View className="bg-white p-4 rounded-2xl flex-row items-center justify-between border border-gray-100">
                  <View className="flex-row items-center" style={{ gap: 16 }}>
                    <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center">
                      <Ionicons name={t.icon as any} size={20} color={theme.colors.primary} />
                    </View>
                    <View>
                      <Text className="font-bold text-gray-800">{t.name}</Text>
                      <Text className="text-xs text-gray-500">
                        {t.type === 'interval' ? 'Interval' : 'Single'}: {Math.floor(t.duration / 60)} min • {t.category}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => startTimer(t.name, t.duration)}
                    className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center"
                  >
                    <Ionicons name="play" size={16} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white/90 border-t border-red-100 flex-row items-center justify-around px-6"
        style={{ paddingBottom: insets.bottom + 4, height: 70 + insets.bottom }}
      >
        <TouchableOpacity activeOpacity={0.75} className="items-center" style={{ gap: 2 }}>
          <Ionicons name="grid" size={24} color={theme.colors.primary} />
          <Text className="text-[10px] font-bold text-red-600">Home</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.75} className="items-center" style={{ gap: 2 }}>
          <Ionicons name="time-outline" size={24} color={theme.colors.tabInactive} />
          <Text className="text-[10px] font-medium text-gray-400">History</Text>
        </TouchableOpacity>
        <View style={{ marginTop: -28 }}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/customizable_countdown_and_interval_timers_with_alerts')}
          >
            <LinearGradient
              colors={['#EF4444', '#B91C1C']}
              className="w-14 h-14 rounded-2xl items-center justify-center"
              style={{ shadowColor: '#FCA5A5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 }}
            >
              <Ionicons name="add" size={32} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <TouchableOpacity activeOpacity={0.75} className="items-center" style={{ gap: 2 }}>
          <Ionicons name="bar-chart-outline" size={24} color={theme.colors.tabInactive} />
          <Text className="text-[10px] font-medium text-gray-400">Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.75} className="items-center" style={{ gap: 2 }}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.tabInactive} />
          <Text className="text-[10px] font-medium text-gray-400">Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}