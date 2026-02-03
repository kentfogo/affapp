import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
// Slightly lower threshold so a natural swipe registers more reliably
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;
const SWIPE_OUT_DURATION = 250;

interface SwipeableAffirmationCardProps {
  affirmation: {
    id: string;
    text: string;
    category: string;
  };
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isFirst: boolean;
}

export const SwipeableAffirmationCard: React.FC<SwipeableAffirmationCardProps> = ({
  affirmation,
  onSwipeLeft,
  onSwipeRight,
  isFirst,
}) => {
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isFirst,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
        
        // Calculate rotation based on horizontal movement
        const rotateValue = gesture.dx / SCREEN_WIDTH / 2;
        rotate.setValue(rotateValue);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          // Swipe right - accept
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // Swipe left - reject
          forceSwipe('left');
        } else {
          // Return to original position
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = (direction: 'left' | 'right') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x, y: 0 },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Reset for next card
      position.setValue({ x: 0, y: 0 });
      rotate.setValue(0);
      opacity.setValue(1);
      
      // Call appropriate callback
      if (direction === 'right') {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      friction: 4,
    }).start();
    
    Animated.spring(rotate, {
      toValue: 0,
      useNativeDriver: false,
      friction: 4,
    }).start();
  };

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  const animatedCardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate: rotateInterpolate },
    ],
    opacity,
  };

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[styles.card, animatedCardStyle, !isFirst && styles.cardBehind]}
      {...(isFirst ? panResponder.panHandlers : {})}
    >
      {/* Like stamp */}
      <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
        <Text style={styles.stampText}>ACCEPT</Text>
      </Animated.View>

      {/* Nope stamp */}
      <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
        <Text style={styles.stampText}>REJECT</Text>
      </Animated.View>

      {/* Card content */}
      <View style={styles.content}>
        <Text style={styles.affirmationText}>"{affirmation.text}"</Text>
        <Text style={styles.categoryText}>{affirmation.category}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: 500,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardBehind: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  affirmationText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 20,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stamp: {
    position: 'absolute',
    top: 50,
    borderWidth: 4,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    transform: [{ rotate: '-20deg' }],
  },
  stampLike: {
    right: 40,
    borderColor: '#4CAF50',
  },
  stampNope: {
    left: 40,
    borderColor: '#F44336',
    transform: [{ rotate: '20deg' }],
  },
  stampText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});
