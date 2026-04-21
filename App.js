import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/utils/supabase';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AuthScreen from './src/screens/AuthScreen';

function Root() {
  const { theme, colors } = useTheme();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </View>
    );
  }

  if (!session) {
    return (
      <>
        <AuthScreen />
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </>
    );
  }

  // Dashboard goes here
  return (
    <View style={[styles.loader, { backgroundColor: colors.bg }]}>
      <ActivityIndicator color={colors.accent} size="large" />
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
