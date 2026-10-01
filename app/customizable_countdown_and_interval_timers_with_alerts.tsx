import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

interface Timer {
  id: string;
  name: string;
  duration: number; // seconds
  type: 'countdown' | 'interval';
  intervals?: number;
  breakDuration?: number;
  icon: keyof typeof Ionicons.glyphMap;
  category: string;
}

interface ActiveSession {
  timer: Timer;
  remaining: number;
  isRunning: boolean;
  currentInterval: number;
  isBreak: boolean;
}

const STORAGE_KEY = 'implement_it_timers';
const QUICK_TIMERS: Timer[] = [
  { id: 'q1', name: 'Break', duration: 300, type: 'countdown', icon: 'cafe-outline', category: 'Rest' },
  { id: 'q2', name: 'Focus', duration: 1500, type: 'countdown', icon: 'bulb-outline', category: 'Work' },
  { id: 'q3', name: 'Reading', duration: 2700, type: 'countdown', icon: 'book-outline', category: 'Learn' },
  { id: 'q4', name: 'HIIT', duration: 600, type: 'interval', intervals: 10, breakDuration: 30, icon: 'barbell-outline', category: 'Fitness' },
];

const DEFAULT_TIMERS: Timer[] = [
  { id: 'd1', name: 'Code Refactor', duration: 3600, type: 'interval', intervals: 2, breakDuration: 300, icon: 'code-slash-outline', category: 'Focus' },
  { id: 'd2', name: 'Meditation', duration: 900, type: 'countdown', icon: 'leaf-outline', category: 'Health' },
  { id: 'd3', name: 'Email Blitz', duration: 1200, type: 'countdown', icon: 'mail-outline', category: 'Admin' },
];

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function endTime(seconds: number) {
  const d = new Date(Date.now() + seconds * 1000);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function CustomizableCountdownAndIntervalTimersWithAlerts() {
  const router = useRouter();
  const [timers, setTimers] = useState<Timer[]>(DEFAULT_TIMERS);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showActive, setShowActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formMinutes, setFormMinutes] = useState('25');
  const [formType, setFormType] = useState<'countdown' | 'interval'>('countdown');
  const [formIntervals, setFormIntervals] = useState('4');
  const [formBreak, setFormBreak] = useState('5');
  const [formCategory, setFormCategory] = useState('Focus');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(d => { if (d) setTimers(JSON.parse(d)); });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
  }, [timers]);

  const startTimer = useCallback((timer: Timer) => {
    setSession({ timer, remaining: timer.duration, isRunning: true, currentInterval: 1, isBreak: false });
    setShowActive(true);
  }, []);

  useEffect(() => {
    if (session?.isRunning) {
      intervalRef.current = setInterval(() => {
        setSession(prev => {
          if (!prev) return null;
          if (prev.remaining <= 1) {
            Vibration.vibrate([0, 500, 200, 500]);
            if (prev.timer.type === 'interval' && prev.timer.intervals && prev.timer.breakDuration) {
              if (prev.isBreak) {
                if (prev.currentInterval >= prev.timer.intervals) {
                  clearInterval(intervalRef.current!);
                  return { ...prev, remaining: 0, isRunning: false };
                }
                return { ...prev, remaining: prev.timer.duration, isBreak: false, currentInterval: prev.currentInterval + 1 };
              } else {
                return { ...prev, remaining: prev.timer.breakDuration, isBreak: true };
              }
            }
            clearInterval(intervalRef.current!);
            return { ...prev, remaining: 0, isRunning: false };
          }
          return { ...prev, remaining: prev.remaining - 1 };
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [session?.isRunning]);

  const togglePause = () => {
    setSession(prev => prev ? { ...prev, isRunning: !prev.isRunning } : null);
  };

  const stopSession = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSession(null);
    setShowActive(false);
  };

  const createTimer = () => {
    if (!formName.trim()) return;
    const t: Timer = {
      id: Date.now().toString(),
      name: formName.trim(),
      duration: parseInt(formMinutes || '25') * 60,
      type: formType,
      intervals: formType === 'interval' ? parseInt(formIntervals || '4') : undefined,
      breakDuration: formType === 'interval' ? parseInt(formBreak || '5') * 60 : undefined,
      icon: 'timer-outline',
      category: formCategory,
    };
    setTimers(prev => [t, ...prev]);
    setShowCreate(false);
    setFormName(''); setFormMinutes('25'); setFormType('countdown');
  };

  const progress = session ? 1 - session.remaining / session.timer.duration : 0;
  const circumference = 2 * Math.PI * 54;

  // Active timer full screen modal
  if (showActive && session) {
    return (
      <SafeAreaView className="flex-1 bg-red-50">
        <View className="flex-1 items-center justify-center px-6">
          <TouchableOpacity onPress={() => setShowActive(false)} className="absolute top-4 left-4 z-10">
            <Ionicons name="chevron-back" size={28} color="#DC2626" />
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.duration(400)} className="items-center">
            <Text className="text-xs font-bold uppercase tracking-widest text-red-600 mb-1">
              {session.isBreak ? 'Break Time' : session.timer.type === 'interval' ? `Round ${session.currentInterval}/${session.timer.intervals}` : 'Focus'}
            </Text>
            <Text className="text-2xl font-bold text-gray-900 mb-8">{session.timer.name}</Text>

            <View className="w-48 h-48 items-center justify-center mb-8">
              <Svg width={192} height={192} className="absolute -rotate-90">
                <Circle cx={96} cy={96} r={54} stroke="#FEE2E2" strokeWidth={8} fill="none" />
                <Circle cx={96} cy={96} r={54} stroke={session.isBreak ? '#F59E0B' : '#EF4444'} strokeWidth={8} fill="none"
                  strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} strokeLinecap="round" />
              </Svg>
              <Text className="text-5xl font-light text-gray-900" style={{ fontVariant: ['tabular-nums'] }}>{fmt(session.remaining)}</Text>
            </View>

            {session.remaining === 0 ? (
              <View className="items-center">
                <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
                <Text className="text-lg font-bold text-green-600 mt-2">Session Complete!</Text>
                <TouchableOpacity onPress={stopSession} className="mt-6 bg-red-600 px-8 py-3 rounded-2xl" activeOpacity={0.75}>
                  <Text className="text-white font-bold text-base">Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row items-center gap-6">
                <TouchableOpacity onPress={stopSession} className="w-14 h-14 rounded-full bg-red-100 items-center justify-center" activeOpacity={0.75}>
                  <Ionicons name="stop" size={24} color="#DC2626" />
                </TouchableOpacity>
                <TouchableOpacity onPress={togglePause} className="w-20 h-20 rounded-full bg-red-600 items-center justify-center shadow-lg" activeOpacity={0.75}>
                  <Ionicons name={session.isRunning ? 'pause' : 'play'} size={32} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSession(prev => prev ? { ...prev, remaining: prev.timer.duration, isBreak: false, currentInterval: 1 } : null)}
                  className="w-14 h-14 rounded-full bg-red-100 items-center justify-center" activeOpacity={0.75}>
                  <Ionicons name="refresh" size={24} color="#DC2626" />
                </TouchableOpacity>
              </View>
            )}

            <Text className="text-sm text-gray-400 mt-6">Ends at {endTime(session.remaining)}</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-red-50">
      {/* Header */}
      <View className="px-6 pt-2 pb-4 flex-row items-center justify-between bg-white/80">
        <View>
          <Text className="text-xs font-bold uppercase tracking-widest text-red-600">Implement It</Text>
          <Text className="text-xl font-bold text-gray-900">Focus Hub</Text>
        </View>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-red-100 items-center justify-center" activeOpacity={0.75}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Active Timer Card */}
        {session && (
          <Animated.View entering={FadeInDown.duration(300)} className="mt-4">
            <TouchableOpacity onPress={() => setShowActive(true)} activeOpacity={0.95}>
              <LinearGradient colors={['#EF4444', '#B91C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                className="rounded-3xl p-6 shadow-xl overflow-hidden">
                <View className="flex-row justify-between items-start mb-8">
                  <View>
                    <View className="bg-white/20 px-3 py-1 rounded-full mb-1 self-start">
                      <Text className="text-white text-[10px] font-bold uppercase tracking-wider">Running Now</Text>
                    </View>
                    <Text className="text-2xl font-bold text-white">{session.timer.name}</Text>
                  </View>
                  <View className="w-12 h-12 items-center justify-center">
                    <Svg width={48} height={48} className="-rotate-90">
                      <Circle cx={24} cy={24} r={20} stroke="rgba(255,255,255,0.2)" strokeWidth={4} fill="none" />
                      <Circle cx={24} cy={24} r={20} stroke="white" strokeWidth={4} fill="none"
                        strokeDasharray={126} strokeDashoffset={126 * (1 - progress)} strokeLinecap="round" />
                    </Svg>
                    <Ionicons name={session.isRunning ? 'play' : 'pause'} size={14} color="white" style={{ position: 'absolute' }} />
                  </View>
                </View>
                <View className="flex-row items-end justify-between">
                  <Text className="text-5xl font-light text-white" style={{ fontVariant: ['tabular-nums'] }}>{fmt(session.remaining)}</Text>
                  <Text className="text-sm text-white/80">Ends at {endTime(session.remaining)}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Quick Start */}
        <View className="mt-8">
          <Text className="font-bold text-gray-800 mb-4">Quick Start</Text>
          <View className="flex-row flex-wrap gap-4">
            {QUICK_TIMERS.map((t, i) => (
              <Animated.View key={t.id} entering={FadeInDown.delay(i * 80)} className="w-[47%]">
                <TouchableOpacity onPress={() => startTimer(t)} activeOpacity={0.75}
                  className="bg-white/90 border border-red-100 p-4 rounded-2xl items-center gap-3">
                  <View className="w-12 h-12 bg-red-100 rounded-xl items-center justify-center">
                    <Ionicons name={t.icon} size={24} color="#DC2626" />
                  </View>
                  <View className="items-center">
                    <Text className="font-bold text-gray-800">{t.name}</Text>
                    <Text className="text-xs text-gray-500">{fmt(t.duration)}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Your Timers */}
        <View className="mt-8 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-bold text-gray-800">Your Timers</Text>
            <TouchableOpacity onPress={() => setShowCreate(true)} className="flex-row items-center gap-1" activeOpacity={0.75}>
              <Ionicons name="add" size={16} color="#DC2626" />
              <Text className="text-sm font-semibold text-red-600">New</Text>
            </TouchableOpacity>
          </View>
          {timers.map((t, i) => (
            <Animated.View key={t.id} entering={FadeInDown.delay(i * 60)} className="mb-3">
              <View className="bg-white p-4 rounded-2xl flex-row items-center justify-between border border-gray-100">
                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center">
                    <Ionicons name={t.icon} size={20} color="#DC2626" />
                  </View>
                  <View>
                    <Text className="font-bold text-gray-800">{t.name}</Text>
                    <Text className="text-xs text-gray-500">{t.type === 'interval' ? `Interval: ${t.duration / 60} min` : `Single: ${t.duration / 60} min`} • {t.category}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => startTimer(t)} className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center" activeOpacity={0.75}>
                  <Ionicons name="play" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-red-50">
          <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
            <TouchableOpacity onPress={() => setShowCreate(false)}><Text className="text-red-600 font-semibold">Cancel</Text></TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">New Timer</Text>
            <TouchableOpacity onPress={createTimer}><Text className="text-red-600 font-bold">Save</Text></TouchableOpacity>
          </View>
          <ScrollView className="px-6 mt-4" keyboardShouldPersistTaps="handled">
            <Text className="text-sm font-semibold text-gray-600 mb-1">Name</Text>
            <TextInput value={formName} onChangeText={setFormName} placeholder="e.g. Deep Work" placeholderTextColor="#9CA3AF"
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4" />

            <Text className="text-sm font-semibold text-gray-600 mb-1">Duration (minutes)</Text>
            <TextInput value={formMinutes} onChangeText={setFormMinutes} keyboardType="numeric" placeholderTextColor="#9CA3AF"
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4" />

            <Text className="text-sm font-semibold text-gray-600 mb-2">Type</Text>
            <View className="flex-row gap-3 mb-4">
              {(['countdown', 'interval'] as const).map(tp => (
                <TouchableOpacity key={tp} onPress={() => setFormType(tp)} activeOpacity={0.75}
                  className={`flex-1 py-3 rounded-xl items-center border ${formType === tp ? 'bg-red-600 border-red-600' : 'bg-white border-gray-200'}`}>
                  <Text className={`font-semibold capitalize ${formType === tp ? 'text-white' : 'text-gray-700'}`}>{tp}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {formType === 'interval' && (
              <>
                <Text className="text-sm font-semibold text-gray-600 mb-1">Intervals</Text>
                <TextInput value={formIntervals} onChangeText={setFormIntervals} keyboardType="numeric" placeholderTextColor="#9CA3AF"
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4" />
                <Text className="text-sm font-semibold text-gray-600 mb-1">Break (minutes)</Text>
                <TextInput value={formBreak} onChangeText={setFormBreak} keyboardType="numeric" placeholderTextColor="#9CA3AF"
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4" />
              </>
            )}

            <Text className="text-sm font-semibold text-gray-600 mb-1">Category</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {['Focus', 'Health', 'Admin', 'Fitness', 'Learn'].map(c => (
                <TouchableOpacity key={c} onPress={() => setFormCategory(c)} activeOpacity={0.75}
                  className={`px-4 py-2 rounded-full border ${formCategory === c ? 'bg-red-600 border-red-600' : 'bg-white border-gray-200'}`}>
                  <Text className={`text-sm font-medium ${formCategory === c ? 'text-white' : 'text-gray-700'}`}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}