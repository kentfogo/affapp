import React, { useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SHADOW } from '../constants/colors';

interface SwipeableCardProps {
  affirmation: {
    id: string;
    text: string;
    category: string;
  };
  onSwipeRight: () => void; // Accept
  onSwipeLeft: () => void;  // Reject
  isLast?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;

export default function SwipeableAffirmationCard({
  affirmation,
  onSwipeRight,
  onSwipeLeft,
  isLast,
}: SwipeableCardProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // More sensitive on web - trigger on any movement
        return Platform.OS === 'web' 
          ? Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5
          : Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        // Set initial position on web for better tracking
        if (Platform.OS === 'web') {
          pan.setOffset({ x: 0, y: 0 });
        }
      },
      onPanResponderMove: (
        event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        if (Platform.OS === 'web') {
          // Direct value setting for web
          pan.x.setValue(gestureState.dx);
          pan.y.setValue(gestureState.dy);
        } else {
          Animated.event(
            [null, { dx: pan.x, dy: pan.y }],
            { useNativeDriver: false }
          )(event, gestureState);
        }
      },
      onPanResponderRelease: (
        event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        if (Platform.OS === 'web') {
          pan.flattenOffset();
        }
        
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe right - accept
          Animated.timing(pan.x, {
            toValue: SCREEN_WIDTH * 1.5,
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            resetCard();
            onSwipeRight();
          });
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe left - reject
          Animated.timing(pan.x, {
            toValue: -SCREEN_WIDTH * 1.5,
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            resetCard();
            onSwipeLeft();
          });
        } else {
          // Return to center
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleAccept = () => {
    Animated.timing(pan.x, {
      toValue: SCREEN_WIDTH * 1.5,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      resetCard();
      onSwipeRight();
    });
  };

  const handleReject = () => {
    Animated.timing(pan.x, {
      toValue: -SCREEN_WIDTH * 1.5,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      resetCard();
      onSwipeLeft();
    });
  };

  const resetCard = () => {
    pan.x.setValue(0);
    pan.y.setValue(0);
    scaleAnim.setValue(1);
  };

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.5, 0, SCREEN_WIDTH * 0.5],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const opacity = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.5, 0, SCREEN_WIDTH * 0.5],
    outputRange: [0.5, 1, 0.5],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotate },
            { scale: scaleAnim },
          ],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.card}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{affirmation.category}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.affirmationText}>{affirmation.text}</Text>
        </View>

        <View style={styles.actionHint}>
          {Platform.OS === 'web' ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleReject}
              >
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={handleAccept}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.swipeLeftText}>← Reject</Text>
              <Text style={styles.swipeRightText}>Accept →</Text>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: SCREEN_WIDTH - 48,
    height: 400,
  },
  card: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 20,
    padding: 24,
    justifyContent: 'space-between',
    ...SHADOW.medium,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  affirmationText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
  },
  actionHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  swipeLeftText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  swipeRightText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: '#FF6B6B',
    marginRight: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});


