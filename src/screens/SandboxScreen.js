import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '../context/NavigationContext';
import { api } from '../utils/api';
import Win98Button from '../components/Win98Button';

export default function SandboxScreen() {
  const { colors } = useTheme();
  const { navigate } = useNavigation();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stopping, setStopping] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    const [sessionsRes, statsRes] = await Promise.allSettled([
      api.listSessions(),
      api.sandboxStats(),
    ]);
    if (sessionsRes.status === 'fulfilled') {
      const d = sessionsRes.value;
      setSessions(Array.isArray(d) ? d : (d.sessions ?? []));
    }
    if (statsRes.status === 'fulfilled') {
      setStats(statsRes.value);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const handleStop = async (sessionId) => {
    setStopping(sessionId);
    try {
      await api.stopSandbox({ session_id: sessionId });
      await load(true);
    } catch {}
    setStopping(null);
  };

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
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
    >
      {/* Header */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            color: colors.textStrong,
            fontFamily: 'monospace',
            fontSize: 18,
            fontWeight: '700',
            letterSpacing: 1,
          }}
        >
          Sandbox
        </Text>
        <Text
          style={{
            color: colors.textDim,
            fontFamily: 'monospace',
            fontSize: 9,
            letterSpacing: 2,
            marginTop: 4,
          }}
        >
          DOCKER SESSIONS — TEST YOUR CLI LIVE
        </Text>
      </View>

      {/* Stats */}
      {stats ? (
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'ACTIVE SESSIONS', value: stats.active_sessions ?? 0 },
            { label: 'TOTAL SESSIONS', value: stats.total_sessions ?? 0 },
          ].map((s) => (
            <View
              key={s.label}
              style={{
                flex: 1,
                backgroundColor: colors.bg2,
                borderWidth: 1,
                borderTopColor: colors.bevelLight,
                borderLeftColor: colors.bevelLight,
                borderBottomColor: colors.bevelDark,
                borderRightColor: colors.bevelDark,
                padding: 14,
              }}
            >
              <Text
                style={{
                  color: colors.textStrong,
                  fontFamily: 'monospace',
                  fontSize: 22,
                  fontWeight: '700',
                }}
              >
                {s.value}
              </Text>
              <Text
                style={{
                  color: colors.textDim,
                  fontFamily: 'monospace',
                  fontSize: 8,
                  letterSpacing: 1,
                  marginTop: 4,
                }}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Sessions list */}
      <Text
        style={{
          color: colors.textDim,
          fontFamily: 'monospace',
          fontSize: 9,
          letterSpacing: 2,
          marginBottom: 10,
        }}
      >
        SESSIONS ({sessions.length})
      </Text>

      {sessions.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.bg2,
            borderWidth: 1,
            borderTopColor: colors.bevelLight,
            borderLeftColor: colors.bevelLight,
            borderBottomColor: colors.bevelDark,
            borderRightColor: colors.bevelDark,
            padding: 32,
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Feather name="terminal" size={22} color={colors.textDim} />
          <Text
            style={{
              color: colors.textDim,
              fontFamily: 'monospace',
              fontSize: 11,
              textAlign: 'center',
              lineHeight: 18,
            }}
          >
            {'No active sessions.\nUse "Sandbox" from a project\'s Build tab.'}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {sessions.map((session) => (
            <View
              key={session.id}
              style={{
                backgroundColor: colors.bg2,
                borderWidth: 1,
                borderTopColor: colors.bevelLight,
                borderLeftColor: colors.bevelLight,
                borderBottomColor: colors.bevelDark,
                borderRightColor: colors.bevelDark,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {/* Status dot */}
              <View
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor:
                    session.status === 'running'
                      ? colors.accent
                      : colors.textDim,
                  flexShrink: 0,
                }}
              />

              {/* Session info */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.textStrong,
                    fontFamily: 'monospace',
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {session.id?.slice(0, 8)}...
                </Text>
                <Text
                  style={{
                    color: colors.textDim,
                    fontFamily: 'monospace',
                    fontSize: 9,
                    marginTop: 3,
                    letterSpacing: 0.3,
                  }}
                >
                  {session.status?.toUpperCase() ?? 'UNKNOWN'} ·{' '}
                  {session.created_at
                    ? new Date(session.created_at).toLocaleString()
                    : '—'}
                </Text>
              </View>

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {session.status === 'running' ? (
                  <>
                    <Win98Button
                      title="Open →"
                      onPress={() =>
                        navigate('sandbox-session', { sessionId: session.id })
                      }
                    />
                    <Win98Button
                      title="Stop"
                      variant="secondary"
                      onPress={() => handleStop(session.id)}
                      loading={stopping === session.id}
                    />
                  </>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
