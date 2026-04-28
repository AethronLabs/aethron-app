import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '../context/NavigationContext';
import { Platform } from 'react-native';
import { api, getAuthHeaders, BASE_URL } from '../utils/api';
import { supabase } from '../utils/supabase';
import Win98Button from '../components/Win98Button';
import RustCodeViewer from '../components/RustCodeViewer';
import ShimmerText from '../components/ShimmerText';

const TABS = ['SPEC', 'COMMANDS', 'BUILD'];

export default function ProjectDetailScreen() {
  const { colors } = useTheme();
  const { params, navigate } = useNavigation();
  const { id: projectId, name: projectName } = params;

  const [activeTab, setActiveTab] = useState('SPEC');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generateCommandsOnMount, setGenerateCommandsOnMount] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const data = await api.getProject(projectId);
      setProject(data);
    } catch {}
    setLoading(false);
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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header + tabs */}
      <View
        style={{
          backgroundColor: colors.bg2,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingHorizontal: 20,
          paddingTop: 18,
          paddingBottom: 0,
        }}
      >
        <TouchableOpacity
          onPress={() => navigate('dashboard')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
          }}
        >
          <Feather name="arrow-left" size={11} color={colors.textDim} />
          <Text
            style={{
              color: colors.textDim,
              fontFamily: 'monospace',
              fontSize: 10,
              letterSpacing: 0.5,
            }}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text
            style={{
              color: colors.textStrong,
              fontFamily: 'monospace',
              fontSize: 15,
              fontWeight: '700',
              flex: 1,
            }}
            numberOfLines={1}
          >
            {projectName ?? project?.name ?? 'Project'}
          </Text>
          <TouchableOpacity
            onPress={async () => {
              try {
                await api.deleteProject(projectId);
                navigate('dashboard');
              } catch {}
            }}
            style={{
              padding: 7,
              borderWidth: 1,
              borderTopColor: colors.bevelLight,
              borderLeftColor: colors.bevelLight,
              borderBottomColor: colors.bevelDark,
              borderRightColor: colors.bevelDark,
              backgroundColor: colors.bg3,
              marginLeft: 12,
            }}
          >
            <Feather name="trash-2" size={12} color={colors.red ?? '#ff5555'} />
          </TouchableOpacity>
        </View>

        {/* Win98-style tabs */}
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderWidth: 1,
                  borderTopColor: colors.bevelLight,
                  borderLeftColor: colors.bevelLight,
                  borderRightColor: colors.bevelDark,
                  borderBottomColor: isActive ? colors.bg2 : colors.bevelDark,
                  backgroundColor: isActive ? colors.bg : colors.bg3,
                  marginBottom: isActive ? -1 : 0,
                  zIndex: isActive ? 1 : 0,
                }}
              >
                <Text
                  style={{
                    color: isActive ? colors.accent : colors.textDim,
                    fontFamily: 'monospace',
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 0.8,
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {activeTab === 'SPEC' && (
        <SpecTab
          projectId={projectId}
          project={project}
          onSpecUploaded={loadProject}
          onGoToCommands={() => {
            setGenerateCommandsOnMount(true);
            setActiveTab('COMMANDS');
          }}
        />
      )}
      {activeTab === 'COMMANDS' && (
        <CommandsTab
          projectId={projectId}
          projectSlug={project?.name ?? projectName}
          onGoToBuild={() => setActiveTab('BUILD')}
          generateOnMount={generateCommandsOnMount}
          onGenerateDone={() => setGenerateCommandsOnMount(false)}
        />
      )}
      {activeTab === 'BUILD' && (
        <BuildTab projectId={projectId} navigate={navigate} />
      )}
    </View>
  );
}

function SpecTab({ projectId, project, onSpecUploaded, onGoToCommands }) {
  const { colors } = useTheme();
  const [specText, setSpecText] = useState('');
  const [loadingSpec, setLoadingSpec] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [specSaved, setSpecSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadExistingSpec();
  }, [projectId]);

  const loadExistingSpec = async () => {
    setLoadingSpec(true);
    try {
      const data = await api.getSpec(projectId);
      const raw = typeof data === 'string'
        ? data
        : data.spec ?? data.content ?? data.source ?? null;
      if (raw) { setSpecText(raw); setSpecSaved(true); }
    } catch {}
    setLoadingSpec(false);
  };

  const handleUpload = async () => {
    if (!specText.trim()) { setError('Paste your OpenAPI spec above.'); return; }
    setUploading(true);
    setError('');
    try {
      await api.uploadSpec(projectId, specText.trim());
      setSpecSaved(true);
      onSpecUploaded();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateCommands = () => {
    onGoToCommands();
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Step indicators */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        {[
          { n: '01', label: 'Save Spec', done: specSaved },
          { n: '02', label: 'Generate Commands', done: false },
        ].map((s, i) => (
          <View
            key={s.n}
            style={{
              flex: 1,
              backgroundColor: s.done ? colors.accentDim : colors.bg2,
              borderWidth: 1,
              borderColor: s.done ? 'rgba(0,201,122,0.35)' : colors.border,
              padding: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Text style={{ color: s.done ? colors.accent : colors.textDim, fontFamily: 'monospace', fontSize: 9, fontWeight: '700' }}>
              {s.done ? '✓' : s.n}
            </Text>
            <Text style={{ color: s.done ? colors.accent : colors.textDim, fontFamily: 'monospace', fontSize: 10 }}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 9, letterSpacing: 2 }}>
          OPENAPI SPEC (YAML OR JSON)
        </Text>
        {loadingSpec ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : specSaved ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentDim, borderWidth: 1, borderColor: 'rgba(0,201,122,0.3)', paddingHorizontal: 7, paddingVertical: 3 }}>
            <Feather name="check" size={9} color={colors.accent} />
            <Text style={{ color: colors.accent, fontFamily: 'monospace', fontSize: 9 }}>saved</Text>
          </View>
        ) : null}
      </View>

      <View
        style={{
          borderWidth: 1,
          borderTopColor: colors.bevelDark,
          borderLeftColor: colors.bevelDark,
          borderBottomColor: colors.bevelLight,
          borderRightColor: colors.bevelLight,
          backgroundColor: colors.inputBg,
          marginBottom: 14,
        }}
      >
        <TextInput
          value={specText}
          onChangeText={(t) => { setSpecText(t); setSpecSaved(false); }}
          multiline
          editable={!loadingSpec}
          style={{
            color: colors.text,
            fontFamily: 'monospace',
            fontSize: 11,
            lineHeight: 18,
            padding: 12,
            minHeight: 240,
            textAlignVertical: 'top',
            outlineStyle: 'none',
          }}
          placeholder={'openapi: "3.0.3"\ninfo:\n  title: My API\n  version: 1.0.0\n...'}
          placeholderTextColor={colors.textDim}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {error ? (
        <View style={{ backgroundColor: colors.redDim, borderWidth: 1, borderColor: 'rgba(255,85,85,0.3)', padding: 8, marginBottom: 12 }}>
          <Text style={{ color: colors.red, fontFamily: 'monospace', fontSize: 10 }}>⚠ {error}</Text>
        </View>
      ) : null}

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
        <Win98Button
          title={specSaved ? 'Re-upload Spec' : 'Save Spec'}
          variant="secondary"
          onPress={handleUpload}
          loading={uploading}
          icon={<Feather name="upload" size={12} color={colors.textMid} />}
        />
        <Win98Button
          title="Generate Commands →"
          onPress={handleGenerateCommands}
          disabled={!specSaved}
        />
      </View>

      {project?.spec_uploaded_at ? (
        <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 9, letterSpacing: 1, marginTop: 16 }}>
          LAST SAVED: {new Date(project.spec_uploaded_at).toLocaleString()}
        </Text>
      ) : null}
    </ScrollView>
  );
}

function buildUsage(slug, cmd) {
  const parts = [slug ?? 'cli'];
  if (cmd.command_name) parts.push(cmd.command_name);
  if (cmd.subcommand && cmd.subcommand !== cmd.command_name) parts.push(cmd.subcommand);
  if (cmd.flags?.length) {
    cmd.flags.forEach((f) => parts.push(`--${f.name} <${f.name}>`));
  }
  return parts.join(' ');
}

function CommandsTab({ projectId, projectSlug, onGoToBuild, generateOnMount, onGenerateDone }) {
  const { colors } = useTheme();
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const abortRef = React.useRef(null);

  useEffect(() => {
    abortRef.current = { cancelled: false };
    const current = abortRef.current;
    if (generateOnMount) {
      runGenerate(current);
    } else {
      loadCommands();
    }
    return () => { current.cancelled = true; };
  }, [projectId]);

  const runGenerate = async (abort) => {
    setLoading(false);
    setGenerating(true);
    setGenerateError('');
    try {
      await api.generateCommands(projectId);
      if (abort?.cancelled) return;
      onGenerateDone?.();
      await loadCommands();
    } catch (e) {
      if (abort?.cancelled) return;
      setGenerateError(e.message);
      onGenerateDone?.();
      await loadCommands();
    } finally {
      if (!abort?.cancelled) setGenerating(false);
    }
  };

  const loadCommands = async () => {
    setLoading(true);
    try {
      const data = await api.getCommands(projectId);
      setCommands(Array.isArray(data) ? data : (data.commands ?? []));
    } catch {}
    setLoading(false);
  };

  const saveCommand = async (cmdId) => {
    setSaving(true);
    try {
      await api.updateCommand(projectId, cmdId, { command_name: editName });
      await loadCommands();
      setEditingId(null);
    } catch {}
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (generating) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <ActivityIndicator color={colors.accent} />
        <ShimmerText text="Generating commands with AI…" />
      </View>
    );
  }

  if (generatingCode) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <ActivityIndicator color={colors.accent} />
        <ShimmerText text="Generating Rust CLI with AI…" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20 }}
    >
      {generateError ? (
        <View style={{ backgroundColor: colors.redDim, borderWidth: 1, borderColor: 'rgba(255,85,85,0.3)', padding: 8, marginBottom: 14 }}>
          <Text style={{ color: colors.red, fontFamily: 'monospace', fontSize: 10 }}>⚠ {generateError}</Text>
        </View>
      ) : null}

      <Text
        style={{
          color: colors.textDim,
          fontFamily: 'monospace',
          fontSize: 9,
          letterSpacing: 2,
          marginBottom: 14,
        }}
      >
        GENERATED COMMANDS ({commands.length})
      </Text>

      {commands.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.bg2,
            borderWidth: 1,
            borderTopColor: colors.bevelLight,
            borderLeftColor: colors.bevelLight,
            borderBottomColor: colors.bevelDark,
            borderRightColor: colors.bevelDark,
            padding: 28,
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Feather name="code" size={20} color={colors.textDim} />
          <Text
            style={{
              color: colors.textDim,
              fontFamily: 'monospace',
              fontSize: 11,
              textAlign: 'center',
            }}
          >
            No commands yet.{'\n'}Upload a spec first.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {commands.map((cmd) => (
            <View
              key={cmd.id}
              style={{
                backgroundColor: colors.bg2,
                borderWidth: 1,
                borderTopColor: colors.bevelLight,
                borderLeftColor: colors.bevelLight,
                borderBottomColor: colors.bevelDark,
                borderRightColor: colors.bevelDark,
                padding: 14,
              }}
            >
              {editingId === cmd.id ? (
                <View style={{ gap: 10 }}>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    style={{
                      color: colors.text,
                      fontFamily: 'monospace',
                      fontSize: 12,
                      borderWidth: 1,
                      borderTopColor: colors.bevelDark,
                      borderLeftColor: colors.bevelDark,
                      borderBottomColor: colors.bevelLight,
                      borderRightColor: colors.bevelLight,
                      paddingHorizontal: 8,
                      height: 32,
                      backgroundColor: colors.inputBg,
                      outlineStyle: 'none',
                    }}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Win98Button
                      title="Save"
                      onPress={() => saveCommand(cmd.id)}
                      loading={saving}
                    />
                    <Win98Button
                      title="Cancel"
                      variant="secondary"
                      onPress={() => setEditingId(null)}
                    />
                  </View>
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      style={{
                        color: colors.accent,
                        fontFamily: 'monospace',
                        fontSize: 13,
                        fontWeight: '700',
                      }}
                    >
                      {cmd.command_name ?? cmd.subcommand ?? '—'}
                    </Text>
                    {cmd.subcommand &&
                    cmd.subcommand !== cmd.command_name ? (
                      <Text
                        style={{
                          color: colors.textMid,
                          fontFamily: 'monospace',
                          fontSize: 10,
                        }}
                      >
                        sub: {cmd.subcommand}
                      </Text>
                    ) : null}

                    {/* Usage string */}
                    <View
                      style={{
                        backgroundColor: colors.bg3,
                        borderWidth: 1,
                        borderTopColor: colors.bevelDark,
                        borderLeftColor: colors.bevelDark,
                        borderBottomColor: colors.bevelLight,
                        borderRightColor: colors.bevelLight,
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        marginTop: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.textMid,
                          fontFamily: 'monospace',
                          fontSize: 10,
                          lineHeight: 16,
                        }}
                        numberOfLines={2}
                      >
                        <Text style={{ color: colors.accent }}>$ </Text>
                        {buildUsage(projectSlug, cmd)}
                      </Text>
                    </View>

                    {cmd.flags?.length > 0 ? (
                      <Text
                        style={{
                          color: colors.textDim,
                          fontFamily: 'monospace',
                          fontSize: 9,
                          marginTop: 4,
                        }}
                        numberOfLines={2}
                      >
                        {cmd.flags.map((f) => `--${f.name}${f.required ? '' : '?'}`).join('  ')}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingId(cmd.id);
                      setEditName(cmd.command_name ?? '');
                    }}
                    style={{
                      padding: 7,
                      borderWidth: 1,
                      borderTopColor: colors.bevelLight,
                      borderLeftColor: colors.bevelLight,
                      borderBottomColor: colors.bevelDark,
                      borderRightColor: colors.bevelDark,
                      backgroundColor: colors.bg3,
                    }}
                  >
                    <Feather name="edit-2" size={11} color={colors.textMid} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Generate Code CTA */}
      {commands.length > 0 ? (
        <View style={{ marginTop: 20, gap: 10 }}>
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: colors.textStrong, fontFamily: 'monospace', fontSize: 11, fontWeight: '700' }}>
                Happy with the commands?
              </Text>
              <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 10 }}>
                AI will generate a Rust CLI from these
              </Text>
            </View>
            <Win98Button
              title="Generate Code →"
              onPress={async () => {
                const current = abortRef.current;
                setGeneratingCode(true);
                try {
                  await api.generateCode(projectId);
                  if (current?.cancelled) return;
                  onGoToBuild();
                } catch (e) {
                  if (current?.cancelled) return;
                  setGenerateError(e.message);
                  setGeneratingCode(false);
                }
              }}
              loading={generatingCode}
            />
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function TomlViewer({ code, onDownload, embedded = false }) {
  const lines = code.split('\n');
  const gutterWidth = String(lines.length).length * 9 + 16;

  const codeArea = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} style={{ backgroundColor: '#050505', flex: embedded ? 1 : undefined }}>
      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={embedded ? { flex: 1 } : { maxHeight: 420 }} contentContainerStyle={{ paddingVertical: 10 }}>
        {lines.map((line, i) => {
          const isSection = /^\s*\[/.test(line);
          const isComment = /^\s*#/.test(line);
          const eqIdx = line.indexOf('=');
          return (
            <View key={i} style={{ flexDirection: 'row', minHeight: 20, alignItems: 'flex-start' }}>
              <View style={{ width: gutterWidth, backgroundColor: '#1a1a1a', alignItems: 'flex-end', paddingRight: 12, paddingLeft: 8, borderRightWidth: 1, borderRightColor: '#1e1e1e', marginRight: 16, flexShrink: 0 }}>
                <Text style={{ color: '#3a3a3a', fontFamily: 'monospace', fontSize: 11, lineHeight: 20 }}>{i + 1}</Text>
              </View>
              <Text style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 20 }}>
                {isComment ? <Text style={{ color: '#4b5263' }}>{line}</Text>
                  : isSection ? <Text style={{ color: '#e5c07b' }}>{line}</Text>
                  : eqIdx > 0 ? <><Text style={{ color: '#61afef' }}>{line.slice(0, eqIdx)}</Text><Text style={{ color: '#7a8694' }}>{'='}</Text><Text style={{ color: '#f5a623' }}>{line.slice(eqIdx + 1)}</Text></>
                  : <Text style={{ color: '#e2e2e2' }}>{line}</Text>}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </ScrollView>
  );

  if (embedded) return codeArea;

  return (
    <View style={{ borderWidth: 1, borderTopColor: '#1a1a1a', borderLeftColor: '#1a1a1a', borderBottomColor: '#333', borderRightColor: '#333', overflow: 'hidden' }}>
      <View style={{ backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#222', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 7 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, backgroundColor: '#e5c07b' }} />
          <Text style={{ color: '#4b5263', fontFamily: 'monospace', fontSize: 9, letterSpacing: 1 }}>
            Cargo.toml — {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </Text>
        </View>
        {onDownload ? (
          <TouchableOpacity onPress={onDownload} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderTopColor: '#333', borderLeftColor: '#333', borderBottomColor: '#111', borderRightColor: '#111', backgroundColor: '#1a1a1a' }}>
            <Feather name="download" size={10} color="#7a8694" />
            <Text style={{ color: '#7a8694', fontFamily: 'monospace', fontSize: 9, letterSpacing: 0.5 }}>Download</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {codeArea}
    </View>
  );
}

function unescape(s) {
  return s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\r/g, '');
}

const OS_TABS = [
  { key: 'mac', label: 'macOS', icon: 'monitor' },
  { key: 'linux', label: 'Linux', icon: 'terminal' },
  { key: 'windows', label: 'Windows', icon: 'grid' },
  { key: 'shell_script', label: 'Script', icon: 'code' },
];

function InstallTabs({ install, colors }) {
  const [activeOs, setActiveOs] = useState('mac');
  const [copied, setCopied] = useState(false);
  const command = install[activeOs];

  const handleCopy = () => {
    if (!command) return;
    if (Platform.OS === 'web') {
      navigator.clipboard?.writeText(command).catch(() => {});
    } else {
      const { Clipboard } = require('react-native');
      Clipboard?.setString?.(command);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View
      style={{
        backgroundColor: colors.bg3,
        borderWidth: 1,
        borderTopColor: colors.bevelDark,
        borderLeftColor: colors.bevelDark,
        borderBottomColor: colors.bevelLight,
        borderRightColor: colors.bevelLight,
        overflow: 'hidden',
      }}
    >
      {/* OS tab bar */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {OS_TABS.filter((t) => install[t.key]).map((tab) => {
          const active = activeOs === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => { setActiveOs(tab.key); setCopied(false); }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                paddingVertical: 8,
                backgroundColor: active ? colors.bg2 : 'transparent',
                borderBottomWidth: active ? 2 : 0,
                borderBottomColor: colors.accent,
              }}
            >
              <Feather name={tab.icon} size={11} color={active ? colors.accent : colors.textDim} />
              <Text
                style={{
                  fontFamily: 'monospace',
                  fontSize: 9,
                  fontWeight: '700',
                  letterSpacing: 0.5,
                  color: active ? colors.accent : colors.textDim,
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Command display with inline copy */}
      <View style={{ padding: 10 }}>
        <View
          style={{
            backgroundColor: '#0a0a0a',
            borderWidth: 1,
            borderTopColor: colors.bevelDark,
            borderLeftColor: colors.bevelDark,
            borderBottomColor: colors.bevelLight,
            borderRightColor: colors.bevelLight,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, padding: 10 }}>
            <Text
              style={{ color: colors.accent, fontFamily: 'monospace', fontSize: 10, lineHeight: 16 }}
              selectable
            >
              <Text style={{ color: colors.textDim }}>$ </Text>
              {command ?? 'N/A'}
            </Text>
          </ScrollView>
          <TouchableOpacity
            onPress={handleCopy}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginRight: 6,
              borderWidth: 1,
              borderTopColor: copied ? 'rgba(0,201,122,0.4)' : '#333',
              borderLeftColor: copied ? 'rgba(0,201,122,0.4)' : '#333',
              borderBottomColor: copied ? 'rgba(0,201,122,0.2)' : '#111',
              borderRightColor: copied ? 'rgba(0,201,122,0.2)' : '#111',
              backgroundColor: copied ? 'rgba(0,201,122,0.1)' : '#1a1a1a',
            }}
          >
            <Feather name={copied ? 'check' : 'copy'} size={11} color={copied ? colors.accent : '#aaa'} />
            <Text style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: '700', color: copied ? colors.accent : '#aaa' }}>
              {copied ? 'Copied!' : 'Copy'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function BuildingDots() {
  const [dots, setDots] = React.useState(0);
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <Text style={{ color: '#f0c040', fontFamily: 'monospace', fontSize: 12, fontWeight: '700' }}>
      BUILDING{'.'.repeat(dots)}
    </Text>
  );
}

function BuildingBar() {
  const [barWidth, setBarWidth] = React.useState(0);
  useEffect(() => {
    const t = setInterval(() => setBarWidth((w) => (w >= 100 ? 0 : w + 2)), 50);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={{ width: '100%', height: 3, backgroundColor: '#1a1a1a', overflow: 'hidden' }}>
      <View style={{ width: `${barWidth}%`, height: 3, backgroundColor: '#f0c040' }} />
    </View>
  );
}

function BuildTab({ projectId, navigate }) {
  const { colors } = useTheme();
  const [status, setStatus] = useState(null);
  const [previewCode, setPreviewCode] = useState('');
  const [cargoToml, setCargoToml] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState('main.rs');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [watching, setWatching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sseRef = React.useRef(null);
  const pollRef = React.useRef(null);

  const loadStatus = async () => {
    try {
      const data = await api.getStatus(projectId);
      setStatus(data);
      return data;
    } catch {}
    return null;
  };

  const stopWatching = () => {
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setWatching(false);
  };

  const handleStatusUpdate = (data) => {
    if (!data) return;
    const s = data.status;
    setStatus(data);
    if (s === 'ready' || s === 'published') {
      setSuccess('Build complete! Install link is ready.');
      stopWatching();
    } else if (s === 'failed') {
      setError(data.error ?? 'Build failed. Check logs or try again.');
      stopWatching();
    }
  };

  // Fallback: poll every 5s
  const startPolling = () => {
    if (pollRef.current) return;
    setWatching(true);
    pollRef.current = setInterval(async () => {
      const data = await loadStatus();
      if (data && data.status !== 'building' && data.status !== 'uploading') {
        handleStatusUpdate(data);
      }
    }, 5000);
  };

  // Primary: SSE stream, falls back to polling
  const startWatching = async () => {
    stopWatching();
    setWatching(true);

    // Try SSE first
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { startPolling(); return; }

      const es = new EventSource(
        `${BASE_URL}/projects/${projectId}/status/stream?token=${token}`
      );
      sseRef.current = es;

      let connected = false;
      es.onopen = () => { connected = true; };

      es.addEventListener('status', (e) => {
        try {
          const { status: buildStatus, data } = JSON.parse(e.data);
          const merged = {
            ...(status ?? {}),
            status: buildStatus,
            ...(data?.install ? { install: data.install } : {}),
            ...(data?.install_url ? { install_url: data.install_url } : {}),
            ...(data?.version ? { version: data.version } : {}),
            ...(data?.error ? { error: data.error } : {}),
          };
          handleStatusUpdate(merged);
        } catch {}
      });

      es.onerror = () => {
        es.close();
        sseRef.current = null;
        // If never connected, SSE endpoint doesn't exist — fall back to polling
        if (!connected) {
          startPolling();
        } else {
          // Was connected but lost connection — one-time check then poll
          loadStatus().then((data) => {
            if (data && data.status !== 'building' && data.status !== 'uploading') {
              handleStatusUpdate(data);
            } else {
              startPolling();
            }
          });
        }
      };
    } catch {
      startPolling();
    }
  };

  useEffect(() => {
    return () => stopWatching();
  }, []);

  const handlePreview = async () => {
    setLoadingPreview(true);
    setError('');
    try {
      const data = await api.previewCode(projectId);
      if (data.source_code) { setPreviewCode(unescape(data.source_code)); setSelectedFile('main.rs'); }
      if (data.cargo_toml) setCargoToml(unescape(data.cargo_toml));
      if (data.base_url) setBaseUrl(data.base_url);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const data = await loadStatus();
      handlePreview();
      if (data && (data.status === 'building' || data.status === 'uploading')) {
        startWatching();
      }
    };
    init();
    return () => stopWatching();
  }, [projectId]);

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      const url = `${BASE_URL}/projects/${projectId}/download`;

      if (Platform.OS === 'web') {
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`Download failed (${res.status})`);
        const disposition = res.headers.get('Content-Disposition') ?? '';
        const match = disposition.match(/filename="?([^";\s]+)"?/);
        const filename = match?.[1] ?? `project-${projectId}.zip`;
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(objectUrl);
      } else {
        const FileSystem = await import('expo-file-system/legacy');
        const Sharing = await import('expo-sharing');
        const dest = `${FileSystem.cacheDirectory}project-${projectId}.zip`;
        const { status, uri } = await FileSystem.downloadAsync(url, dest, { headers });
        if (status !== 200) throw new Error(`Download failed (${status})`);
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/zip',
            dialogTitle: 'Save Project Source',
            UTI: 'public.zip-archive',
          });
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloading(false);
    }
  };

  const handlePublish = async () => {
    stopWatching();
    setPublishing(true);
    setError('');
    setSuccess('');
    try {
      await api.publish(projectId);
      setStatus((prev) => ({ ...prev, status: 'building' }));
      startWatching();
    } catch (e) {
      setError(e.message);
    } finally {
      setPublishing(false);
    }
  };

  const isBuilding = watching || status?.status === 'building' || status?.status === 'uploading';
  const isReady = status?.status === 'ready' || status?.status === 'published';
  const isFailed = status?.status === 'failed';

  const publishLabel = isReady ? 'Re-publish →' : 'Publish →';

  return (
    <View style={{ flex: 1 }}>
      {/* Top controls — fixed, no scroll */}
      <View style={{ padding: 16, paddingBottom: 12, gap: 10 }}>
        {/* Status row: inline status + buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          {/* Status indicator */}
          {isBuilding ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color="#f0c040" />
              <BuildingDots />
            </View>
          ) : status ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 7, height: 7, backgroundColor: isReady ? colors.accent : isFailed ? (colors.red ?? '#ff5555') : colors.textDim }} />
              <Text style={{ color: isReady ? colors.accent : isFailed ? (colors.red ?? '#ff5555') : colors.textMid, fontFamily: 'monospace', fontSize: 12, fontWeight: '700' }}>
                {(status.status ?? 'IDLE').toUpperCase()}
              </Text>
              {status.version ? (
                <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 10 }}>v{status.version}</Text>
              ) : null}
            </View>
          ) : null}

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Win98Button title={publishLabel} onPress={handlePublish} loading={publishing} />
            <Win98Button title="Refresh" variant="secondary" onPress={() => { loadStatus(); handlePreview(); }} loading={loadingPreview} icon={<Feather name="refresh-cw" size={11} color={colors.textMid} />} />
          </View>
        </View>

        {/* Building progress bar */}
        {isBuilding ? <BuildingBar /> : null}

        {error ? (
          <View style={{ backgroundColor: colors.redDim, borderWidth: 1, borderColor: 'rgba(255,85,85,0.3)', padding: 8 }}>
            <Text style={{ color: colors.red ?? '#ff5555', fontFamily: 'monospace', fontSize: 10 }}>⚠ {error}</Text>
          </View>
        ) : null}

        {success && !isReady ? (
          <View style={{ backgroundColor: colors.accentDim, borderWidth: 1, borderColor: 'rgba(0,201,122,0.3)', padding: 8 }}>
            <Text style={{ color: colors.accent, fontFamily: 'monospace', fontSize: 10 }}>✓ {success}</Text>
          </View>
        ) : null}

        {/* Install section when ready */}
        {isReady && status.install ? (
          <InstallTabs install={status.install} colors={colors} />
        ) : isReady && status.install_url ? (
          <View style={{ backgroundColor: colors.bg3, borderWidth: 1, borderTopColor: colors.bevelDark, borderLeftColor: colors.bevelDark, borderBottomColor: colors.bevelLight, borderRightColor: colors.bevelLight, padding: 10, gap: 6 }}>
            <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 9, letterSpacing: 1 }}>INSTALL</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={{ color: colors.accent, fontFamily: 'monospace', fontSize: 10 }} selectable>
                curl -fsSL {status.install_url} | sh
              </Text>
            </ScrollView>
          </View>
        ) : null}
      </View>

      {/* IDE section: takes all remaining space */}
      {(previewCode || cargoToml) ? (
        <View style={{ flex: 1, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderTopColor: '#1a1a1a', borderLeftColor: '#1a1a1a', borderBottomColor: '#333', borderRightColor: '#333', overflow: 'hidden', flexDirection: 'row' }}>

          {/* File tree panel */}
          <View style={{ width: 180, backgroundColor: '#0d0d0d', borderRightWidth: 1, borderRightColor: '#1e1e1e' }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e1e1e' }}>
              <Text style={{ color: '#3a3a3a', fontFamily: 'monospace', fontSize: 9, letterSpacing: 2 }}>EXPLORER</Text>
            </View>
            <View style={{ paddingVertical: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Feather name="chevron-down" size={10} color="#4b5263" />
                <Feather name="folder" size={12} color="#e5c07b" />
                <Text style={{ color: '#888', fontFamily: 'monospace', fontSize: 11 }} numberOfLines={1}>{projectId.slice(0, 8)}</Text>
              </View>
              {cargoToml ? (
                <TouchableOpacity onPress={() => setSelectedFile('Cargo.toml')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, paddingLeft: 28, backgroundColor: selectedFile === 'Cargo.toml' ? '#1a2a1a' : 'transparent' }}>
                  <Feather name="file-text" size={11} color={selectedFile === 'Cargo.toml' ? '#00c97a' : '#4b5263'} />
                  <Text style={{ color: selectedFile === 'Cargo.toml' ? '#00c97a' : '#7a8694', fontFamily: 'monospace', fontSize: 11 }}>Cargo.toml</Text>
                </TouchableOpacity>
              ) : null}
              {previewCode ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, paddingLeft: 28 }}>
                    <Feather name="chevron-down" size={10} color="#4b5263" />
                    <Feather name="folder" size={12} color="#e5c07b" />
                    <Text style={{ color: '#888', fontFamily: 'monospace', fontSize: 11 }}>src</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedFile('main.rs')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, paddingLeft: 46, backgroundColor: selectedFile === 'main.rs' ? '#1a2a1a' : 'transparent' }}>
                    <Feather name="file" size={11} color={selectedFile === 'main.rs' ? '#00c97a' : '#4b5263'} />
                    <Text style={{ color: selectedFile === 'main.rs' ? '#00c97a' : '#7a8694', fontFamily: 'monospace', fontSize: 11 }}>main.rs</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>

          {/* Code panel */}
          <View style={{ flex: 1, flexDirection: 'column', backgroundColor: '#050505' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#1e1e1e', paddingHorizontal: 14, paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 8, height: 8, backgroundColor: selectedFile === 'main.rs' ? '#f5a623' : '#e5c07b' }} />
                <Text style={{ color: '#aaa', fontFamily: 'monospace', fontSize: 10 }}>{selectedFile}</Text>
                <Text style={{ color: '#444', fontFamily: 'monospace', fontSize: 9 }}>— {(selectedFile === 'main.rs' ? previewCode : cargoToml)?.split('\n').length ?? 0} lines</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity onPress={handleDownload} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderTopColor: '#333', borderLeftColor: '#333', borderBottomColor: '#111', borderRightColor: '#111', backgroundColor: '#1a1a1a' }}>
                  <Feather name="download" size={10} color="#7a8694" />
                  <Text style={{ color: '#7a8694', fontFamily: 'monospace', fontSize: 9 }}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { const { Share } = require('react-native'); Share.share({ message: selectedFile === 'main.rs' ? previewCode : cargoToml, title: selectedFile }).catch(() => {}); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderTopColor: '#333', borderLeftColor: '#333', borderBottomColor: '#111', borderRightColor: '#111', backgroundColor: '#1a1a1a' }}>
                  <Feather name="share-2" size={10} color="#7a8694" />
                  <Text style={{ color: '#7a8694', fontFamily: 'monospace', fontSize: 9 }}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
            {selectedFile === 'main.rs' && previewCode ? (
              <RustCodeViewer code={previewCode} filename="main.rs" embedded />
            ) : selectedFile === 'Cargo.toml' && cargoToml ? (
              <TomlViewer code={cargoToml} embedded />
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
