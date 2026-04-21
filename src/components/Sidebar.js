import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const SIDEBAR_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 52;

const SidebarContext = createContext(null);
export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const toggleSidebar = () => setOpen((o) => !o);

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggleSidebar }}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {children}
      </View>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ children }) {
  const { open } = useSidebar();
  const { colors } = useTheme();
  const animWidth = useRef(
    new Animated.Value(open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH)
  ).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [open]);

  return (
    <Animated.View
      style={{
        width: animWidth,
        backgroundColor: colors.bg2,
        borderRightWidth: 1,
        borderRightColor: colors.bevelDark,
        overflow: 'hidden',
        flexDirection: 'column',
      }}
    >
      {children}
    </Animated.View>
  );
}

export function SidebarHeader({ children }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {children}
    </View>
  );
}

export function SidebarContent({ children }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 8 }}
    >
      {children}
    </ScrollView>
  );
}

export function SidebarFooter({ children }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      {children}
    </View>
  );
}

export function SidebarGroup({ children }) {
  return <View style={{ marginBottom: 4 }}>{children}</View>;
}

export function SidebarGroupLabel({ children }) {
  const { open } = useSidebar();
  const { colors } = useTheme();
  if (!open) return null;
  return (
    <Text
      style={{
        color: colors.textDim,
        fontFamily: 'monospace',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1.5,
        paddingHorizontal: 14,
        paddingVertical: 6,
      }}
    >
      {children}
    </Text>
  );
}

export function SidebarGroupContent({ children }) {
  return <View>{children}</View>;
}

export function SidebarMenu({ children }) {
  return <View>{children}</View>;
}

export function SidebarMenuItem({ children }) {
  return <View>{children}</View>;
}

export function SidebarMenuButton({ icon, label, isActive, onPress, badge }) {
  const { open } = useSidebar();
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 36,
        paddingHorizontal: 14,
        backgroundColor: isActive
          ? colors.accentDim
          : pressed
          ? colors.bg3
          : 'transparent',
        borderLeftWidth: 2,
        borderLeftColor: isActive ? colors.accent : 'transparent',
        gap: 10,
      }}
    >
      <View style={{ width: 16, alignItems: 'center' }}>{icon}</View>
      {open && (
        <Text
          style={{
            color: isActive ? colors.accent : colors.text,
            fontFamily: 'monospace',
            fontSize: 11,
            fontWeight: isActive ? '700' : '400',
            letterSpacing: 0.3,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
      {open && badge != null && (
        <View
          style={{
            backgroundColor: colors.accentDim,
            borderWidth: 1,
            borderColor: colors.accent,
            paddingHorizontal: 5,
            paddingVertical: 1,
            minWidth: 20,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: colors.accent,
              fontFamily: 'monospace',
              fontSize: 9,
              fontWeight: '700',
            }}
          >
            {badge}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function SidebarInset({ children }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {children}
    </View>
  );
}

export function SidebarTrigger({ style }) {
  const { toggleSidebar, open } = useSidebar();
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleSidebar}
      style={[
        {
          width: 26,
          height: 26,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderTopColor: colors.bevelLight,
          borderLeftColor: colors.bevelLight,
          borderBottomColor: colors.bevelDark,
          borderRightColor: colors.bevelDark,
          backgroundColor: colors.bg3,
        },
        style,
      ]}
    >
      <Feather
        name={open ? 'chevron-left' : 'chevron-right'}
        size={11}
        color={colors.textMid}
      />
    </TouchableOpacity>
  );
}
