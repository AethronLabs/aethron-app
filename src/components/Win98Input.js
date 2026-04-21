import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function Win98Input({ label, ...props }) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  return (
    <View style={s.wrapper}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput
        style={s.input}
        placeholderTextColor={colors.textDim}
        {...props}
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  label: {
    color: colors.textDim,
    fontFamily: 'monospace',
    fontSize: 10,
    marginBottom: 4,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    color: colors.text,
    fontFamily: 'monospace',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderTopColor: colors.inputBevelDark,
    borderLeftColor: colors.inputBevelDark,
    borderBottomColor: colors.inputBevelLight,
    borderRightColor: colors.inputBevelLight,
    outlineStyle: 'none',
  },
});
