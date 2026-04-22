import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function Win98Button({ title, onPress, loading, disabled, variant = 'primary', style, icon }) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  const isPrimary = variant === 'primary';
  const isDisabled = loading || disabled;
  const s = getStyles(colors);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isDisabled}
      activeOpacity={1}
      style={[
        s.btn,
        isPrimary ? s.primary : s.secondary,
        pressed && !isDisabled && (isPrimary ? s.primaryPressed : s.secondaryPressed),
        isDisabled && s.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary ? '#001a0d' : colors.accent} />
      ) : (
        <View style={s.inner}>
          {icon ? <View style={s.iconWrap}>{icon}</View> : null}
          <Text style={[s.text, !isPrimary && s.textSecondary]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const getStyles = (colors) => StyleSheet.create({
  btn: {
    height: 30,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minWidth: 80,
  },
  primary: {
    backgroundColor: colors.accent,
    borderTopColor: colors.bevelLightStrong,
    borderLeftColor: colors.bevelLightStrong,
    borderBottomColor: colors.bevelDarkStrong,
    borderRightColor: colors.bevelDarkStrong,
  },
  primaryPressed: {
    borderTopColor: colors.bevelDarkStrong,
    borderLeftColor: colors.bevelDarkStrong,
    borderBottomColor: colors.bevelLightStrong,
    borderRightColor: colors.bevelLightStrong,
  },
  secondary: {
    backgroundColor: colors.bg3,
    borderTopColor: colors.bevelLight,
    borderLeftColor: colors.bevelLight,
    borderBottomColor: colors.bevelDark,
    borderRightColor: colors.bevelDark,
  },
  secondaryPressed: {
    borderTopColor: colors.bevelDark,
    borderLeftColor: colors.bevelDark,
    borderBottomColor: colors.bevelLight,
    borderRightColor: colors.bevelLight,
  },
  disabled: { opacity: 0.55 },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#001a0d',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  textSecondary: {
    color: colors.textMid,
  },
});
