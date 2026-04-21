import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '../context/NavigationContext';
import { api } from '../utils/api';

export default function SandboxSessionScreen() {
  const { colors } = useTheme();
  const { params, navigate } = useNavigation();
  const { sessionId } = params;

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [output, setOutput] = useState([]);
  const [input, setInput] = useState('');
  const wsRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadSession();
    return () => {
      wsRef.current?.close();
    };
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const data = await api.getSession(sessionId);
      if (data.ws_url) {
        connectWS(data.ws_url);
      } else {
        appendLine('✕ No WebSocket URL for this session.');
      }
    } catch {
      appendLine('✕ Failed to load session.');
    }
    setLoading(false);
  };

  const appendLine = (line) => {
    setOutput((prev) => [...prev, line]);
  };

  const connectWS = (wsUrl) => {
    appendLine('Connecting...');
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        appendLine('✓ Connected.');
        appendLine('');
      };
      ws.onmessage = (e) => {
        appendLine(e.data);
      };
      ws.onerror = () => {
        appendLine('✕ Connection error.');
      };
      ws.onclose = () => {
        setConnected(false);
        appendLine('');
        appendLine('● Session closed.');
      };
    } catch {
      appendLine('✕ WebSocket unavailable in this environment.');
    }
  };

  const sendCommand = () => {
    const cmd = input.trim();
    if (!cmd) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      appendLine('✕ Not connected.');
      return;
    }
    appendLine(`$ ${cmd}`);
    wsRef.current.send(cmd);
    setInput('');
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.bg2,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingHorizontal: 20,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => navigate('sandbox')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Feather name="arrow-left" size={11} color={colors.textDim} />
            <Text
              style={{
                color: colors.textDim,
                fontFamily: 'monospace',
                fontSize: 10,
              }}
            >
              Sandbox
            </Text>
          </TouchableOpacity>
          <View
            style={{ width: 1, height: 14, backgroundColor: colors.border }}
          />
          <Text
            style={{
              color: colors.textStrong,
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: '700',
            }}
          >
            {sessionId?.slice(0, 8)}...
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 7,
              height: 7,
              backgroundColor: connected ? colors.accent : colors.textDim,
            }}
          />
          <Text
            style={{
              color: connected ? colors.accent : colors.textDim,
              fontFamily: 'monospace',
              fontSize: 9,
              letterSpacing: 1,
            }}
          >
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </Text>
        </View>
      </View>

      {/* Terminal output */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: '#050505', padding: 14 }}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {output.map((line, i) => (
          <Text
            key={i}
            style={{
              color: line.startsWith('$')
                ? colors.accent
                : line.startsWith('✕')
                ? '#ff5555'
                : line.startsWith('✓')
                ? colors.accent
                : '#e2e2e2',
              fontFamily: 'monospace',
              fontSize: 11,
              lineHeight: 19,
            }}
          >
            {line}
          </Text>
        ))}
      </ScrollView>

      {/* Input bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.bg2,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: 14,
          paddingVertical: 10,
          gap: 10,
        }}
      >
        <Text
          style={{
            color: colors.accent,
            fontFamily: 'monospace',
            fontSize: 13,
            fontWeight: '700',
          }}
        >
          $
        </Text>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendCommand}
          placeholder="enter command..."
          placeholderTextColor={colors.textDim}
          style={{
            flex: 1,
            color: colors.text,
            fontFamily: 'monospace',
            fontSize: 12,
            padding: 0,
            outlineStyle: 'none',
          }}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={sendCommand}
          style={{
            width: 30,
            height: 30,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: connected ? colors.accent : colors.bg3,
            borderWidth: 1,
            borderTopColor: colors.bevelLight,
            borderLeftColor: colors.bevelLight,
            borderBottomColor: colors.bevelDark,
            borderRightColor: colors.bevelDark,
          }}
        >
          <Feather
            name="arrow-right"
            size={13}
            color={connected ? '#001a0d' : colors.textDim}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
