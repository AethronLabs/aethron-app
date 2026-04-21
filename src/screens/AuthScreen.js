import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { useTheme } from '../context/ThemeContext';
import Win98Window from '../components/Win98Window';
import Win98Input from '../components/Win98Input';
import Win98Button from '../components/Win98Button';

export default function AuthScreen() {
  const { theme, toggle, colors } = useTheme();
  const s = getStyles(colors);

  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const reset = () => { setError(''); setSuccessMsg(''); };

  const switchTab = (t) => {
    setTab(t);
    setEmail(''); setPassword(''); setConfirmPassword('');
    reset();
  };

  const handleLogin = async () => {
    reset();
    if (!email || !password) { setError('Email and password required.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  };

  const handleSignup = async () => {
    reset();
    if (!email || !password || !confirmPassword) { setError('All fields required.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else setSuccessMsg('Check your email to confirm your account.');
  };

  const handleOAuth = async (provider) => {
    reset();
    setOauthLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    setOauthLoading(null);
    if (error) setError(error.message);
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Theme toggle — top right corner */}
      <TouchableOpacity style={s.themeToggle} onPress={toggle}>
        <Feather
          name={theme === 'dark' ? 'sun' : 'moon'}
          size={14}
          color={colors.textDim}
        />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={s.logoRow}>
          <Text style={s.logoText}>ÆTHRON</Text>
          <Text style={s.logoDot}>.</Text>
        </View>
        <Text style={s.logoSub}>AI AGENT INFRASTRUCTURE</Text>

        {/* Window */}
        <Win98Window title="ÆTHRON.EXE — Authentication">

          {/* Tabs */}
          <View style={s.tabs}>
            {['login', 'signup'].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => switchTab(t)}
                style={[s.tab, tab === t && s.tabActive]}
              >
                <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                  {t === 'login' ? 'LOGIN' : 'SIGN UP'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.tabDivider} />

          {/* Form */}
          <View>
            <Win98Input
              label="Email"
              placeholder="user@domain.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Win98Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {tab === 'signup' && (
              <Win98Input
                label="Confirm Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            )}

            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>⚠  {error}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={s.successBox}>
                <Text style={s.successText}>✓  {successMsg}</Text>
              </View>
            ) : null}

            <View style={s.actions}>
              {tab === 'login' ? (
                <TouchableOpacity onPress={() => {}}>
                  <Text style={s.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              ) : <View />}
              <Win98Button
                title={tab === 'login' ? 'Login →' : 'Create account →'}
                onPress={tab === 'login' ? handleLogin : handleSignup}
                loading={loading}
              />
            </View>
          </View>

          {/* OR divider */}
          <View style={s.orRow}>
            <View style={s.orLine} />
            <Text style={s.orText}>or continue with</Text>
            <View style={s.orLine} />
          </View>

          {/* OAuth buttons */}
          <View style={s.oauthRow}>
            <Win98Button
              title="GitHub"
              onPress={() => handleOAuth('github')}
              loading={oauthLoading === 'github'}
              variant="secondary"
              style={s.oauthBtn}
              icon={<AntDesign name="github" size={13} color={colors.textMid} />}
            />
            <Win98Button
              title="Google"
              onPress={() => handleOAuth('google')}
              loading={oauthLoading === 'google'}
              variant="secondary"
              style={s.oauthBtn}
              icon={<AntDesign name="google" size={13} color={colors.textMid} />}
            />
          </View>

        </Win98Window>

        {/* Status bar */}
        <View style={s.statusBar}>
          <Text style={s.statusText}>● SYSTEM READY</Text>
          <Text style={s.statusText}>v0.1.0</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  themeToggle: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 10,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderTopColor: colors.bevelLight,
    borderLeftColor: colors.bevelLight,
    borderBottomColor: colors.bevelDark,
    borderRightColor: colors.bevelDark,
    backgroundColor: colors.bg3,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 60,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  logoText: {
    color: colors.textStrong,
    fontFamily: 'monospace',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 3,
  },
  logoDot: {
    color: colors.accent,
    fontFamily: 'monospace',
    fontSize: 20,
    fontWeight: '700',
  },
  logoSub: {
    color: colors.textDim,
    fontFamily: 'monospace',
    fontSize: 9,
    letterSpacing: 3,
    marginBottom: 24,
  },
  tabs: {
    flexDirection: 'row',
    gap: 2,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderTopColor: colors.bevelLight,
    borderLeftColor: colors.bevelLight,
    borderBottomColor: 'transparent',
    borderRightColor: colors.bevelDark,
    backgroundColor: colors.bg3,
  },
  tabActive: {
    backgroundColor: colors.bg2,
    borderTopColor: colors.bevelLight,
    borderLeftColor: colors.bevelLight,
    borderBottomColor: colors.bg2,
  },
  tabText: {
    color: colors.textDim,
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  tabTextActive: {
    color: colors.accent,
  },
  tabDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
    marginTop: -1,
  },
  errorBox: {
    backgroundColor: colors.redDim,
    borderWidth: 1,
    borderColor: 'rgba(255,85,85,0.3)',
    padding: 8,
    marginBottom: 12,
  },
  errorText: {
    color: colors.red,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  successBox: {
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: 'rgba(0,201,122,0.3)',
    padding: 8,
    marginBottom: 12,
  },
  successText: {
    color: colors.accent,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  forgotText: {
    color: colors.textDim,
    fontFamily: 'monospace',
    fontSize: 10,
    textDecorationLine: 'underline',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orText: {
    color: colors.textDim,
    fontFamily: 'monospace',
    fontSize: 9,
    letterSpacing: 1,
  },
  oauthRow: {
    flexDirection: 'row',
    gap: 8,
  },
  oauthBtn: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusText: {
    color: colors.textDim,
    fontFamily: 'monospace',
    fontSize: 9,
    letterSpacing: 1,
  },
});
