import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { COLORS } from '../constants/colors';
import { Affirmation } from '../types/affirmation';

const NUM_WAVE_BARS = 9;

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Pre-fills the text field when provided. */
  affirmation: Affirmation | null;
  onSave: (customAffirmation: Affirmation) => void;
}

export function RecordAffirmationModal({ visible, onClose, affirmation, onSave }: Props) {
  const [affirmationText, setAffirmationText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');

  const player = useAudioPlayer(recordedUri ? { uri: recordedUri } : null);
  const playerStatus = useAudioPlayerStatus(player);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef(
    Array.from({ length: NUM_WAVE_BARS }, () => new Animated.Value(0.3))
  ).current;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setAffirmationText(affirmation?.text || '');
      setRecordedUri(null);
      setIsRecording(false);
      setTranscribedText('');
    } else {
      player.pause();
      setIsPlaying(false);
    }
  }, [visible]);

  // Detect playback completion
  useEffect(() => {
    if (playerStatus.didJustFinish) setIsPlaying(false);
  }, [playerStatus.didJustFinish]);

  // Speech recognition event listeners
  useSpeechRecognitionEvent('result', (event) => {
    if (!visible) return;
    if (event.results?.[0]) {
      const transcript = event.results[0].transcript;
      setTranscribedText(transcript);
      if (event.isFinal && transcript.trim() && !affirmation) {
        setAffirmationText(transcript.trim());
      }
    }
  });

  useSpeechRecognitionEvent('audioend', (event) => {
    if (!visible) return;
    if (event.uri) setRecordedUri(event.uri);
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (!visible) return;
    console.error('Speech recognition error:', event.error, event.message);
    setIsRecording(false);
  });

  // Pulse animation for record button
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Wave bar animation
  useEffect(() => {
    if (isRecording) {
      const animations = waveAnims.map((anim, i) => {
        const duration = 300 + (i % 3) * 100;
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.5 + Math.random() * 0.5,
              duration,
              delay: i * 80,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.15 + Math.random() * 0.2,
              duration: duration + 50,
              useNativeDriver: true,
            }),
          ])
        );
      });
      animations.forEach(a => a.start());
      return () => animations.forEach(a => a.stop());
    } else {
      waveAnims.forEach(anim => {
        Animated.timing(anim, { toValue: 0.3, duration: 200, useNativeDriver: true }).start();
      });
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert('Permission needed', 'Please allow microphone access to record your voice.');
        return;
      }

      const recordingsDir = `${FileSystem.documentDirectory || ''}recordings/`;
      await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true }).catch(() => {});

      if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      setIsRecording(true);
      setRecordedUri(null);
      setTranscribedText('');

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: true,
        addsPunctuation: true,
        recordingOptions: {
          persist: true,
          outputDirectory: recordingsDir,
          outputFileName: `voice_${Date.now()}.wav`,
        },
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Could not start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsRecording(false);
      ExpoSpeechRecognitionModule.stop();
      // Auto-fill text from transcription only when no pre-filled affirmation
      if (!affirmation && !affirmationText.trim() && transcribedText.trim()) {
        setAffirmationText(transcribedText.trim());
      }
    } catch (error) {
      setIsRecording(false);
    }
  };

  const playRecording = async () => {
    if (!recordedUri) return;
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    setIsPlaying(true);
    player.play();
  };

  const deleteRecording = async () => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    player.pause();
    setIsPlaying(false);
    if (recordedUri) await FileSystem.deleteAsync(recordedUri, { idempotent: true });
    setRecordedUri(null);
  };

  const handleSave = async () => {
    const text = affirmationText.trim() || affirmation?.text || transcribedText.trim();
    if (!text && !recordedUri) {
      Alert.alert('Error', 'Please enter an affirmation or record your voice');
      return;
    }
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const customAffirmation: Affirmation = {
      id: `custom_${Date.now()}`,
      text: text || 'Voice affirmation',
      category: affirmation?.category || 'Custom',
      isCustom: true,
      audioUri: recordedUri || undefined,
    };

    onSave(customAffirmation);
  };

  const handleClose = () => {
    if (isRecording) {
      try { ExpoSpeechRecognitionModule.stop(); } catch {}
    }
    setIsRecording(false);
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
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {affirmation ? 'Record Your Voice' : 'Add Affirmation'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {affirmation ? (
            // Pre-filled from existing affirmation — show as styled quote
            <View style={styles.affirmationDisplay}>
              <Text style={styles.affirmationDisplayText}>"{affirmation.text}"</Text>
              <Text style={styles.affirmationCategory}>{affirmation.category}</Text>
            </View>
          ) : (
            // Custom affirmation — editable text input
            <>
              <Text style={styles.label}>Your Affirmation</Text>
              <TextInput
                style={styles.textInput}
                placeholder="I am capable of achieving my goals..."
                placeholderTextColor={COLORS.textSecondary}
                value={affirmationText}
                onChangeText={setAffirmationText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </>
          )}

          <Text style={[styles.label, { marginTop: 24 }]}>
            {affirmation ? 'Record in your own voice' : 'Record Your Voice (Optional)'}
          </Text>
          <Text style={styles.hint}>Hearing affirmations in your own voice is more powerful</Text>

          <View style={styles.recordingContainer}>
            {!recordedUri ? (
              <View style={styles.waveContainer}>
                {isRecording && (
                  <View style={styles.waveBars}>
                    {waveAnims.slice(0, Math.floor(NUM_WAVE_BARS / 2)).map((anim, i) => (
                      <Animated.View
                        key={`l${i}`}
                        style={[styles.waveBar, { transform: [{ scaleY: anim }], opacity: anim }]}
                      />
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                  onPress={isRecording ? stopRecording : startRecording}
                  activeOpacity={0.8}
                >
                  <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnim : 1 }] }}>
                    <Ionicons
                      name={isRecording ? 'stop' : 'mic'}
                      size={32}
                      color={COLORS.surface}
                    />
                  </Animated.View>
                </TouchableOpacity>
                {isRecording && (
                  <View style={styles.waveBars}>
                    {waveAnims.slice(Math.floor(NUM_WAVE_BARS / 2)).map((anim, i) => (
                      <Animated.View
                        key={`r${i}`}
                        style={[styles.waveBar, { transform: [{ scaleY: anim }], opacity: anim }]}
                      />
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.playbackContainer}>
                <TouchableOpacity style={styles.playButton} onPress={playRecording} disabled={isPlaying}>
                  <Ionicons
                    name={isPlaying ? 'volume-high' : 'play'}
                    size={24}
                    color={COLORS.surface}
                  />
                </TouchableOpacity>
                <View style={styles.recordedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color="#43A047" />
                  <Text style={styles.recordedText}>Voice recorded</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={deleteRecording}>
                  <Ionicons name="trash-outline" size={24} color={COLORS.accent} />
                </TouchableOpacity>
              </View>
            )}

            {isRecording && transcribedText ? (
              <Text style={styles.transcriptionPreview}>"{transcribedText}"</Text>
            ) : null}
            {isRecording && !transcribedText && (
              <Text style={styles.recordingHint}>Listening...</Text>
            )}
            {!recordedUri && !isRecording && (
              <Text style={styles.recordingHint}>Tap to start recording</Text>
            )}
          </View>
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
  cancelText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    padding: 24,
  },
  affirmationDisplay: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 20,
    marginBottom: 4,
  },
  affirmationDisplayText: {
    fontSize: 17,
    color: COLORS.text,
    lineHeight: 26,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  affirmationCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  recordingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  waveBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 80,
  },
  waveBar: {
    width: 4,
    height: 48,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  recordButtonActive: {
    backgroundColor: COLORS.accent,
  },
  recordingHint: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  transcriptionPreview: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  playbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordedText: {
    fontSize: 14,
    color: '#43A047',
    fontWeight: '500',
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
});
