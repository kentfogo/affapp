import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { SessionSettings, IntervalType, DistanceUnit, RepetitionMode, VoicePreset } from '../types/session';
import IntervalPicker from './IntervalPicker';
import { COLORS } from '../constants/colors';
import { VOICE_PRESETS } from '../services/audioService';

interface SessionSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onStartSession: (settings: SessionSettings) => void;
  initialSettings?: Partial<SessionSettings>;
  defaultDistanceUnit?: DistanceUnit;
}

const DEFAULT_SETTINGS: SessionSettings = {
  intervalType: 'time',
  timeInterval: 60,
  distanceInterval: 0.5,
  distanceUnit: 'miles',
  volume: 80,
  repetitionMode: 'sequential',
  playChime: false,
  voicePreset: 'emma',
};

export default function SessionSettingsModal({
  visible,
  onClose,
  onStartSession,
  initialSettings,
  defaultDistanceUnit = 'miles',
}: SessionSettingsModalProps) {
  const [settings, setSettings] = useState<SessionSettings>({
    ...DEFAULT_SETTINGS,
    distanceUnit: defaultDistanceUnit,
    ...initialSettings,
  });

  useEffect(() => {
    if (visible) {
      setSettings({
        ...DEFAULT_SETTINGS,
        distanceUnit: defaultDistanceUnit,
        ...initialSettings,
      });
    }
  }, [visible, initialSettings, defaultDistanceUnit]);

  const handleHaptic = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
  };

  const handleIntervalTypeChange = async (type: IntervalType) => {
    await handleHaptic();
    setSettings(prev => ({ ...prev, intervalType: type }));
  };

  const handleTimeIntervalChange = async (interval: number) => {
    await handleHaptic();
    setSettings(prev => ({ ...prev, timeInterval: interval }));
  };

  const handleDistanceIntervalChange = async (interval: number) => {
    await handleHaptic();
    setSettings(prev => ({ ...prev, distanceInterval: interval }));
  };

  const handleDistanceUnitChange = async (unit: DistanceUnit) => {
    await handleHaptic();
    setSettings(prev => ({ ...prev, distanceUnit: unit }));
  };

  const handleVolumeChange = (value: number) => {
    setSettings(prev => ({ ...prev, volume: Math.round(value) }));
  };

  const handleRepetitionModeChange = async (mode: RepetitionMode) => {
    await handleHaptic();
    setSettings(prev => ({ ...prev, repetitionMode: mode }));
  };

  const handleChimeToggle = async (value: boolean) => {
    await handleHaptic();
    setSettings(prev => ({ ...prev, playChime: value }));
  };

  const handleVoicePresetChange = async (preset: VoicePreset) => {
    await handleHaptic();
    setSettings(prev => ({ ...prev, voicePreset: preset }));
  };

  const handleStartSession = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onStartSession(settings);
  };

  const handleClose = async () => {
    await handleHaptic();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Session Settings</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Interval Settings */}
          <IntervalPicker
            intervalType={settings.intervalType}
            timeInterval={settings.timeInterval}
            distanceInterval={settings.distanceInterval}
            distanceUnit={settings.distanceUnit}
            onIntervalTypeChange={handleIntervalTypeChange}
            onTimeIntervalChange={handleTimeIntervalChange}
            onDistanceIntervalChange={handleDistanceIntervalChange}
            onDistanceUnitChange={handleDistanceUnitChange}
          />

          {/* Volume Control */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Volume</Text>
            <View style={styles.volumeContainer}>
              <Text style={styles.volumeIcon}>🔈</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={settings.volume}
                onValueChange={handleVolumeChange}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.border}
                thumbTintColor={COLORS.primary}
              />
              <Text style={styles.volumeIcon}>🔊</Text>
              <Text style={styles.volumeValue}>{settings.volume}%</Text>
            </View>
          </View>

          {/* Repetition Mode */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Playback Order</Text>
            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  settings.repetitionMode === 'sequential' && styles.modeButtonActive,
                ]}
                onPress={() => handleRepetitionModeChange('sequential')}
              >
                <Text style={styles.modeIcon}>↓</Text>
                <Text
                  style={[
                    styles.modeButtonText,
                    settings.repetitionMode === 'sequential' && styles.modeButtonTextActive,
                  ]}
                >
                  Sequential
                </Text>
                <Text style={styles.modeDescription}>Play in order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  settings.repetitionMode === 'random' && styles.modeButtonActive,
                ]}
                onPress={() => handleRepetitionModeChange('random')}
              >
                <Text style={styles.modeIcon}>🔀</Text>
                <Text
                  style={[
                    styles.modeButtonText,
                    settings.repetitionMode === 'random' && styles.modeButtonTextActive,
                  ]}
                >
                  Shuffle
                </Text>
                <Text style={styles.modeDescription}>Random order</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Chime Toggle */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Play Chime</Text>
                <Text style={styles.toggleDescription}>
                  Play a gentle chime before each affirmation
                </Text>
              </View>
              <Switch
                value={settings.playChime}
                onValueChange={handleChimeToggle}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>

          {/* Voice Preset */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Voice</Text>
            <View style={styles.voiceGrid}>
              {(Object.keys(VOICE_PRESETS) as VoicePreset[]).map((preset) => {
                const voice = VOICE_PRESETS[preset];
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.voiceButton,
                      settings.voicePreset === preset && styles.voiceButtonActive,
                    ]}
                    onPress={() => handleVoicePresetChange(preset)}
                  >
                    <Text
                      style={[
                        styles.voiceButtonLabel,
                        settings.voicePreset === preset && styles.voiceButtonLabelActive,
                      ]}
                    >
                      {voice.name}
                    </Text>
                    <Text style={styles.voiceButtonDescription}>
                      {voice.description}
                    </Text>
                    <Text style={styles.voiceButtonGender}>
                      {voice.gender === 'female' ? '♀' : '♂'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Start Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartSession}
          >
            <Text style={styles.startButtonText}>Start Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  volumeIcon: {
    fontSize: 20,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  volumeValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  modeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}15`,
  },
  modeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  modeButtonTextActive: {
    color: COLORS.primary,
  },
  modeDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footer: {
    padding: 24,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  startButton: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
  },
  voiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  voiceButton: {
    width: '47%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  voiceButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}15`,
  },
  voiceButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  voiceButtonLabelActive: {
    color: COLORS.primary,
  },
  voiceButtonDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  voiceButtonGender: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
