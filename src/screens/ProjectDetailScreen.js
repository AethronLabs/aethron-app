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

  useEffect(() => {
    if (generateOnMount) {
      runGenerate();
    } else {
      loadCommands();
    }
  }, [projectId]);

  const runGenerate = async () => {
    setLoading(false);
    setGenerating(true);
    setGenerateError('');
    try {
      await api.generateCommands(projectId);
      onGenerateDone?.();
      await loadCommands();
    } catch (e) {
      setGenerateError(e.message);
      onGenerateDone?.();
      await loadCommands();
    } finally {
      setGenerating(false);
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
                setGeneratingCode(true);
                try {
                  await api.generateCode(projectId);
                  onGoToBuild();
                } catch (e) {
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadStatus = async () => {
    try {
      const data = await api.getStatus(projectId);
      setStatus(data);
    } catch {}
  };

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
    loadStatus();
    handlePreview();
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
    setPublishing(true);
    setError('');
    setSuccess('');
    try {
      await api.publish(projectId);
      setSuccess('Build triggered. Check status below.');
      await loadStatus();
    } catch (e) {
      setError(e.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, gap: 16 }}
    >
      {/* Build status card */}
      {status ? (
        <View
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
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text
              style={{
                color: colors.textDim,
                fontFamily: 'monospace',
                fontSize: 9,
                letterSpacing: 1,
              }}
            >
              BUILD STATUS
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  backgroundColor:
                    status.status === 'published'
                      ? colors.accent
                      : status.status === 'building'
                      ? '#f0c040'
                      : colors.textDim,
                }}
              />
              <Text
                style={{
                  color:
                    status.status === 'published'
                      ? colors.accent
                      : colors.textMid,
                  fontFamily: 'monospace',
                  fontSize: 13,
                  fontWeight: '700',
                }}
              >
                {(status.status ?? 'IDLE').toUpperCase()}
              </Text>
            </View>
          </View>
          {status.install_url ? (
            <Text
              style={{
                color: colors.textDim,
                fontFamily: 'monospace',
                fontSize: 9,
                maxWidth: 140,
              }}
              numberOfLines={2}
            >
              {status.install_url}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        <Win98Button
          title="Publish →"
          onPress={handlePublish}
          loading={publishing}
        />
        <Win98Button
          title="Sandbox"
          variant="secondary"
          onPress={() => navigate('sandbox')}
          icon={<Feather name="terminal" size={12} color={colors.textMid} />}
        />
        <Win98Button
          title="Refresh"
          variant="secondary"
          onPress={handlePreview}
          loading={loadingPreview}
          icon={<Feather name="refresh-cw" size={12} color={colors.textMid} />}
        />
      </View>

      {error ? (
        <View
          style={{
            backgroundColor: colors.redDim,
            borderWidth: 1,
            borderColor: 'rgba(255,85,85,0.3)',
            padding: 8,
          }}
        >
          <Text
            style={{ color: colors.red, fontFamily: 'monospace', fontSize: 10 }}
          >
            ⚠ {error}
          </Text>
        </View>
      ) : null}

      {success ? (
        <View
          style={{
            backgroundColor: colors.accentDim,
            borderWidth: 1,
            borderColor: 'rgba(0,201,122,0.3)',
            padding: 8,
          }}
        >
          <Text
            style={{
              color: colors.accent,
              fontFamily: 'monospace',
              fontSize: 10,
            }}
          >
            ✓ {success}
          </Text>
        </View>
      ) : null}

      {/* IDE-style source viewer */}
      {(previewCode || cargoToml) ? (
        <View>
          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 9, letterSpacing: 1 }}>
              GENERATED SOURCE
            </Text>
            {baseUrl ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.bg3, borderWidth: 1, borderTopColor: colors.bevelLight, borderLeftColor: colors.bevelLight, borderBottomColor: colors.bevelDark, borderRightColor: colors.bevelDark, paddingHorizontal: 7, paddingVertical: 3 }}>
                <Feather name="link" size={9} color={colors.textDim} />
                <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 9 }} numberOfLines={1}>{baseUrl}</Text>
              </View>
            ) : null}
          </View>

          {/* IDE split: file tree + code panel */}
          <View style={{ flexDirection: 'row', borderWidth: 1, borderTopColor: '#1a1a1a', borderLeftColor: '#1a1a1a', borderBottomColor: '#333', borderRightColor: '#333', overflow: 'hidden' }}>

            {/* File tree panel */}
            <View style={{ width: 190, backgroundColor: '#0d0d0d', borderRightWidth: 1, borderRightColor: '#1e1e1e' }}>
              {/* Explorer header */}
              <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e1e1e' }}>
                <Text style={{ color: '#3a3a3a', fontFamily: 'monospace', fontSize: 9, letterSpacing: 2 }}>EXPLORER</Text>
              </View>

              {/* Tree rows */}
              <View style={{ paddingVertical: 6 }}>
                {/* Root folder */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Feather name="chevron-down" size={10} color="#4b5263" />
                  <Feather name="folder" size={12} color="#e5c07b" />
                  <Text style={{ color: '#888', fontFamily: 'monospace', fontSize: 11 }} numberOfLines={1}>
                    {projectId.slice(0, 8)}
                  </Text>
                </View>

                {/* Cargo.toml */}
                {cargoToml ? (
                  <TouchableOpacity
                    onPress={() => setSelectedFile('Cargo.toml')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, paddingLeft: 28, backgroundColor: selectedFile === 'Cargo.toml' ? '#1a2a1a' : 'transparent' }}
                  >
                    <Feather name="file-text" size={11} color={selectedFile === 'Cargo.toml' ? '#00c97a' : '#4b5263'} />
                    <Text style={{ color: selectedFile === 'Cargo.toml' ? '#00c97a' : '#7a8694', fontFamily: 'monospace', fontSize: 11 }}>
                      Cargo.toml
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {/* src/ folder */}
                {previewCode ? (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, paddingLeft: 28 }}>
                      <Feather name="chevron-down" size={10} color="#4b5263" />
                      <Feather name="folder" size={12} color="#e5c07b" />
                      <Text style={{ color: '#888', fontFamily: 'monospace', fontSize: 11 }}>src</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedFile('main.rs')}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, paddingLeft: 46, backgroundColor: selectedFile === 'main.rs' ? '#1a2a1a' : 'transparent' }}
                    >
                      <Feather name="file" size={11} color={selectedFile === 'main.rs' ? '#00c97a' : '#4b5263'} />
                      <Text style={{ color: selectedFile === 'main.rs' ? '#00c97a' : '#7a8694', fontFamily: 'monospace', fontSize: 11 }}>
                        main.rs
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            </View>

            {/* Code panel */}
            <View style={{ flex: 1, flexDirection: 'column', backgroundColor: '#050505' }}>
              {/* Integrated tab bar */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#1e1e1e', paddingHorizontal: 14, paddingVertical: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 8, height: 8, backgroundColor: selectedFile === 'main.rs' ? '#f5a623' : '#e5c07b' }} />
                  <Text style={{ color: '#aaa', fontFamily: 'monospace', fontSize: 10 }}>
                    {selectedFile}
                  </Text>
                  <Text style={{ color: '#444', fontFamily: 'monospace', fontSize: 9 }}>
                    — {(selectedFile === 'main.rs' ? previewCode : cargoToml)?.split('\n').length ?? 0} lines
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity onPress={handleDownload} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderTopColor: '#333', borderLeftColor: '#333', borderBottomColor: '#111', borderRightColor: '#111', backgroundColor: '#1a1a1a' }}>
                    <Feather name="download" size={10} color="#7a8694" />
                    <Text style={{ color: '#7a8694', fontFamily: 'monospace', fontSize: 9 }}>Download</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const { Share } = require('react-native');
                      Share.share({ message: selectedFile === 'main.rs' ? previewCode : cargoToml, title: selectedFile }).catch(() => {});
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderTopColor: '#333', borderLeftColor: '#333', borderBottomColor: '#111', borderRightColor: '#111', backgroundColor: '#1a1a1a' }}
                  >
                    <Feather name="share-2" size={10} color="#7a8694" />
                    <Text style={{ color: '#7a8694', fontFamily: 'monospace', fontSize: 9 }}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Code content — embedded (no own border/title bar) */}
              {selectedFile === 'main.rs' && previewCode ? (
                <RustCodeViewer code={previewCode} filename="main.rs" embedded />
              ) : selectedFile === 'Cargo.toml' && cargoToml ? (
                <TomlViewer code={cargoToml} embedded />
              ) : null}
            </View>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
