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
import { api } from '../utils/api';
import Win98Button from '../components/Win98Button';
import RustCodeViewer from '../components/RustCodeViewer';

const TABS = ['SPEC', 'COMMANDS', 'BUILD'];

export default function ProjectDetailScreen() {
  const { colors } = useTheme();
  const { params, navigate } = useNavigation();
  const { id: projectId, name: projectName } = params;

  const [activeTab, setActiveTab] = useState('SPEC');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

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

        <Text
          style={{
            color: colors.textStrong,
            fontFamily: 'monospace',
            fontSize: 15,
            fontWeight: '700',
            marginBottom: 16,
          }}
          numberOfLines={1}
        >
          {projectName ?? project?.name ?? 'Project'}
        </Text>

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
        />
      )}
      {activeTab === 'COMMANDS' && (
        <CommandsTab
          projectId={projectId}
          projectSlug={project?.name ?? projectName}
        />
      )}
      {activeTab === 'BUILD' && (
        <BuildTab projectId={projectId} navigate={navigate} />
      )}
    </View>
  );
}

function SpecTab({ projectId, project, onSpecUploaded }) {
  const { colors } = useTheme();
  const [specText, setSpecText] = useState('');
  const [loadingSpec, setLoadingSpec] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      if (raw) setSpecText(raw);
    } catch {}
    setLoadingSpec(false);
  };

  const handleUpload = async () => {
    if (!specText.trim()) {
      setError('Paste your OpenAPI spec above.');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      await api.uploadSpec(projectId, specText.trim());
      setSuccess('Spec uploaded — commands generated. Switch to the COMMANDS tab.');
      onSpecUploaded();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            color: colors.textDim,
            fontFamily: 'monospace',
            fontSize: 9,
            letterSpacing: 2,
          }}
        >
          OPENAPI SPEC (YAML OR JSON)
        </Text>
        {loadingSpec ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : specText ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: colors.accentDim,
              borderWidth: 1,
              borderColor: 'rgba(0,201,122,0.3)',
              paddingHorizontal: 7,
              paddingVertical: 3,
            }}
          >
            <Feather name="check" size={9} color={colors.accent} />
            <Text
              style={{
                color: colors.accent,
                fontFamily: 'monospace',
                fontSize: 9,
              }}
            >
              spec loaded
            </Text>
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
          onChangeText={setSpecText}
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
        <View
          style={{
            backgroundColor: colors.redDim,
            borderWidth: 1,
            borderColor: 'rgba(255,85,85,0.3)',
            padding: 8,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: colors.red,
              fontFamily: 'monospace',
              fontSize: 10,
            }}
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
            marginBottom: 12,
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

      <View style={{ alignItems: 'flex-end' }}>
        <Win98Button
          title="Upload & Generate →"
          onPress={handleUpload}
          loading={uploading}
        />
      </View>

      {project?.spec_uploaded_at ? (
        <Text
          style={{
            color: colors.textDim,
            fontFamily: 'monospace',
            fontSize: 9,
            letterSpacing: 1,
            marginTop: 16,
          }}
        >
          LAST UPLOADED:{' '}
          {new Date(project.spec_uploaded_at).toLocaleString()}
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

function CommandsTab({ projectId, projectSlug }) {
  const { colors } = useTheme();
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCommands();
  }, [projectId]);

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
      <ActivityIndicator
        color={colors.accent}
        style={{ marginTop: 32 }}
      />
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20 }}
    >
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
    </ScrollView>
  );
}

function BuildTab({ projectId, navigate }) {
  const { colors } = useTheme();
  const [status, setStatus] = useState(null);
  const [previewCode, setPreviewCode] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
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
      const raw = data.source_code ?? data.code ?? null;
      if (raw) {
        const unescaped = raw
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\r/g, '');
        setPreviewCode(unescaped);
      }
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
          title="Preview Code"
          variant="secondary"
          onPress={handlePreview}
          loading={loadingPreview}
          icon={<Feather name="code" size={12} color={colors.textMid} />}
        />
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

      {/* Generated source preview */}
      {previewCode ? (
        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                color: colors.textDim,
                fontFamily: 'monospace',
                fontSize: 9,
                letterSpacing: 1,
              }}
            >
              GENERATED RUST SOURCE
            </Text>
            {baseUrl ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: colors.bg3,
                  borderWidth: 1,
                  borderTopColor: colors.bevelLight,
                  borderLeftColor: colors.bevelLight,
                  borderBottomColor: colors.bevelDark,
                  borderRightColor: colors.bevelDark,
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                }}
              >
                <Feather name="link" size={9} color={colors.textDim} />
                <Text
                  style={{
                    color: colors.textDim,
                    fontFamily: 'monospace',
                    fontSize: 9,
                  }}
                  numberOfLines={1}
                >
                  {baseUrl}
                </Text>
              </View>
            ) : null}
          </View>
          <RustCodeViewer code={previewCode} filename="main.rs" />
        </View>
      ) : null}
    </ScrollView>
  );
}
