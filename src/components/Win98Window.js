import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function Win98Window({ title, children }) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  return (
    <View style={s.window}>
      <View style={s.titleBar}>
        <Text style={s.titleText}>{title}</Text>
        <View style={s.windowControls}>
          {['_', '□', '✕'].map((c) => (
            <View key={c} style={s.winBtn}>
              <Text style={s.winBtnText}>{c}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={s.body}>{children}</View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  window: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderTopColor: colors.bevelLight,
    borderLeftColor: colors.bevelLight,
    borderBottomColor: colors.bevelDark,
    borderRightColor: colors.bevelDark,
    width: '100%',
    maxWidth: 400,
  },
  titleBar: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  titleText: {
    color: '#001a0d',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  windowControls: {
    flexDirection: 'row',
    gap: 3,
  },
  winBtn: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.5)',
    borderLeftColor: 'rgba(255,255,255,0.5)',
    borderBottomColor: 'rgba(0,0,0,0.4)',
    borderRightColor: 'rgba(0,0,0,0.4)',
  },
  winBtnText: {
    color: '#001a0d',
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '700',
    lineHeight: 11,
  },
  body: {
    padding: 18,
  },
});
