import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/utils/supabase';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { NavigationProvider, useNavigation } from './src/context/NavigationContext';
import { SidebarProvider, SidebarInset } from './src/components/Sidebar';
import { AppSidebar } from './src/components/AppSidebar';
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import SandboxScreen from './src/screens/SandboxScreen';
import SandboxSessionScreen from './src/screens/SandboxSessionScreen';

function AppLayout() {
  const { screen } = useNavigation();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {screen === 'dashboard' && <DashboardScreen />}
        {screen === 'project' && <ProjectDetailScreen />}
        {screen === 'sandbox' && <SandboxScreen />}
        {screen === 'sandbox-session' && <SandboxSessionScreen />}
      </SidebarInset>
    </SidebarProvider>
  );
}

function Root() {
  const { theme, colors } = useTheme();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.accent} size="large" />
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <>
      {session ? <AppLayout /> : <AuthScreen />}
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationProvider>
        <Root />
      </NavigationProvider>
    </ThemeProvider>
  );
}
