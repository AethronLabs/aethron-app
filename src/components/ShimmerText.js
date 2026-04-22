import React, { useEffect, useRef } from 'react';
import { Platform, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Web version — uses a real <div> so background-clip: text works reliably
function ShimmerTextWeb({ text, style }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const id = 'aethron-shimmer-kf';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = `
        @keyframes aethron-shimmer {
          from { background-position: 200% 0 }
          to   { background-position: -200% 0 }
        }
      `;
      document.head.appendChild(el);
    }
  }, []);

  // Dark: dim grey → white → dim grey
  // Light: light grey → near-black → light grey
  const gradient = isDark
    ? 'linear-gradient(110deg, #404040 30%, #ffffff 50%, #404040 70%)'
    : 'linear-gradient(110deg, #cccccc 30%, #111111 50%, #cccccc 70%)';

  return (
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: 13,
        fontWeight: 700,
        backgroundImage: gradient,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        animation: 'aethron-shimmer 2s linear infinite',
        letterSpacing: 0.3,
        ...style,
      }}
    >
      {text}
    </div>
  );
}

// Native fallback — animated color pulse
function ShimmerTextNative({ text, style }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const color = anim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark ? ['#444444', '#ffffff'] : ['#aaaaaa', '#111111'],
  });

  return (
    <Animated.Text
      style={[
        { fontFamily: 'monospace', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
        style,
        { color },
      ]}
    >
      {text}
    </Animated.Text>
  );
}

export default Platform.OS === 'web' ? ShimmerTextWeb : ShimmerTextNative;
