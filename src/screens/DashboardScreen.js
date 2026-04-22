import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '../context/NavigationContext';
import { api } from '../utils/api';

// ─── Code snippet visuals for the step cards ──────────────────────────────────
const SPEC_SNIPPET = `openapi: "3.0.3"
info:
  title: My API
  version: 1.0.0
paths:
  /users:
    get:
      summary: List users
  /orders:
    post:
      summary: Create order`;

const COMMANDS_SNIPPET = `$ myapi users list
$ myapi users get --id <id>
$ myapi orders create \\
    --amount <amount> \\
    --currency <currency>
$ myapi auth login`;

const RUST_SNIPPET = `use clap::{Parser, Subcommand};

#[derive(Parser)]
struct Cli {
    #[command(subcommand)]
    cmd: Commands,
}

fn main() {
    let cli = Cli::parse();
}`;

// ─── Step hero card ────────────────────────────────────────────────────────────
function StepCard({ num, tag, title, desc, snippet, accentColor, onPress }) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={1}
      style={{ flex: 1, minWidth: 220 }}
    >
      <View
        style={{
          backgroundColor: colors.bg2,
          borderWidth: 1,
          borderTopColor: pressed ? colors.bevelDark : colors.bevelLight,
          borderLeftColor: pressed ? colors.bevelDark : colors.bevelLight,
          borderBottomColor: pressed ? colors.bevelLight : colors.bevelDark,
          borderRightColor: pressed ? colors.bevelLight : colors.bevelDark,
          overflow: 'hidden',
          height: 200,
        }}
      >
        {/* Code snippet background */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 14, overflow: 'hidden' }}>
          <Text style={{ color: accentColor, fontFamily: 'monospace', fontSize: 9, lineHeight: 15, opacity: 0.18 }}>
            {snippet}
          </Text>
        </View>

        {/* Dark gradient overlay — bottom heavy */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 130, backgroundColor: colors.bg2, opacity: 0.92 }} />

        {/* Content */}
        <View style={{ position: 'absolute', top: 12, left: 14, right: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: accentColor, fontFamily: 'monospace', fontSize: 10, fontWeight: '700' }}>{num}</Text>
            <View style={{ borderWidth: 1, borderColor: accentColor, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: accentColor, fontFamily: 'monospace', fontSize: 8, letterSpacing: 1 }}>{tag}</Text>
            </View>
          </View>
        </View>

        <View style={{ position: 'absolute', bottom: 14, left: 14, right: 14, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.textStrong, fontFamily: 'monospace', fontSize: 14, fontWeight: '700' }}>{title}</Text>
            <Feather name="arrow-right" size={14} color={accentColor} />
          </View>
          <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 10, lineHeight: 16 }}>{desc}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Quick action card ─────────────────────────────────────────────────────────
function ActionCard({ icon, title, desc, onPress, colors }) {
  const [pressed, setPressed] = useState(false);
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={1}
      style={{ flex: 1, minWidth: 160 }}
    >
      <View
        style={{
          backgroundColor: colors.bg2,
          borderWidth: 1,
          borderTopColor: pressed ? colors.bevelDark : colors.bevelLight,
          borderLeftColor: pressed ? colors.bevelDark : colors.bevelLight,
          borderBottomColor: pressed ? colors.bevelLight : colors.bevelDark,
          borderRightColor: pressed ? colors.bevelLight : colors.bevelDark,
          padding: 18,
          gap: 12,
        }}
      >
        <Feather name={icon} size={20} color={colors.accent} />
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: colors.textStrong, fontFamily: 'monospace', fontSize: 12, fontWeight: '700' }}>{title}</Text>
            <Feather name="arrow-right" size={11} color={colors.textDim} />
          </View>
          <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 10, lineHeight: 15 }}>{desc}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Project step dot progress ─────────────────────────────────────────────────
function projectStep(project) {
  if (project.status === 'published' || project.status === 'building') return 3;
  if (project.spec_uploaded_at) return 2;
  return 1;
}

function StepDots({ current, colors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={{ width: s <= current ? 16 : 6, height: 6, backgroundColor: s <= current ? colors.accent : colors.border }} />
      ))}
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { colors } = useTheme();
  const { navigate, triggerNewProject } = useNavigation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const d = await api.listProjects();
      setProjects(Array.isArray(d) ? d : (d.projects ?? []));
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 24, gap: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.accent} />}
    >
      {/* ── Page header ── */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: colors.textStrong, fontFamily: 'monospace', fontSize: 20, fontWeight: '700', letterSpacing: 1 }}>
            ÆTHRON<Text style={{ color: colors.accent }}>.</Text>
          </Text>
          <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 11, marginTop: 4 }}>
            Turn any OpenAPI spec into a Rust CLI — instantly.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => navigate('sandbox')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderTopColor: colors.bevelLight, borderLeftColor: colors.bevelLight, borderBottomColor: colors.bevelDark, borderRightColor: colors.bevelDark, backgroundColor: colors.bg3 }}
          >
            <Feather name="terminal" size={11} color={colors.textMid} />
            <Text style={{ color: colors.textMid, fontFamily: 'monospace', fontSize: 10, fontWeight: '700' }}>Sandbox</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={triggerNewProject}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.accent, borderWidth: 1, borderTopColor: 'rgba(255,255,255,0.3)', borderLeftColor: 'rgba(255,255,255,0.3)', borderBottomColor: 'rgba(0,0,0,0.3)', borderRightColor: 'rgba(0,0,0,0.3)' }}
          >
            <Feather name="plus" size={11} color="#001a0d" />
            <Text style={{ color: '#001a0d', fontFamily: 'monospace', fontSize: 10, fontWeight: '700' }}>New Project</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Workflow steps — 3 hero cards ── */}
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 9, letterSpacing: 2, fontWeight: '700' }}>
            THE WORKFLOW
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <StepCard
            num="01"
            tag="SPEC"
            title="Upload Spec"
            desc="Paste your OpenAPI YAML or JSON and let Aethron parse your API."
            snippet={SPEC_SNIPPET}
            accentColor="#61afef"
            onPress={triggerNewProject}
          />
          <StepCard
            num="02"
            tag="AI"
            title="Generate Commands"
            desc="AI maps every endpoint to a typed CLI command with flags."
            snippet={COMMANDS_SNIPPET}
            accentColor={colors.accent}
            onPress={triggerNewProject}
          />
          <StepCard
            num="03"
            tag="RUST"
            title="Build & Ship"
            desc="Download a production-ready Rust CLI or publish a binary."
            snippet={RUST_SNIPPET}
            accentColor="#e5c07b"
            onPress={triggerNewProject}
          />
        </View>
      </View>

      {/* ── Quick actions — 4 cards ── */}
      <View>
        <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 9, letterSpacing: 2, fontWeight: '700', marginBottom: 14 }}>
          QUICK ACTIONS
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <ActionCard icon="folder-plus" title="New Project" desc="Start from an OpenAPI spec" onPress={triggerNewProject} colors={colors} />
          <ActionCard icon="terminal" title="New Sandbox" desc="Run a CLI live in a container" onPress={() => navigate('sandbox')} colors={colors} />
          <ActionCard icon="upload" title="Upload Spec" desc="Add a spec to an existing project" onPress={triggerNewProject} colors={colors} />
          <ActionCard icon="download" title="Download CLI" desc="Get the zip of any built project" onPress={() => projects.length > 0 && navigate('project', { id: projects[0].id, name: projects[0].name })} colors={colors} />
        </View>
      </View>

      {/* ── Projects ── */}
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 9, letterSpacing: 2, fontWeight: '700' }}>
            YOUR PROJECTS ({projects.length})
          </Text>
        </View>

        {projects.length === 0 ? (
          <TouchableOpacity
            onPress={triggerNewProject}
            style={{ backgroundColor: colors.bg2, borderWidth: 1, borderTopColor: colors.bevelLight, borderLeftColor: colors.bevelLight, borderBottomColor: colors.bevelDark, borderRightColor: colors.bevelDark, padding: 32, alignItems: 'center', gap: 12 }}
          >
            <View style={{ width: 48, height: 48, borderWidth: 1, borderTopColor: colors.bevelLight, borderLeftColor: colors.bevelLight, borderBottomColor: colors.bevelDark, borderRightColor: colors.bevelDark, backgroundColor: colors.bg3, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="folder-plus" size={20} color={colors.textDim} />
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{ color: colors.textStrong, fontFamily: 'monospace', fontSize: 12, fontWeight: '700' }}>No projects yet</Text>
              <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 10, textAlign: 'center', lineHeight: 16 }}>
                Click to create your first CLI project
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.accent }}>
              <Feather name="plus" size={11} color="#001a0d" />
              <Text style={{ color: '#001a0d', fontFamily: 'monospace', fontSize: 10, fontWeight: '700' }}>New Project →</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={{ gap: 8 }}>
            {projects.map((project) => {
              const step = projectStep(project);
              const stepColor = step === 3 ? colors.accent : step === 2 ? '#61afef' : colors.textDim;
              const stepLabel = step === 3 ? (project.status?.toUpperCase() ?? 'BUILT') : step === 2 ? 'COMMANDS' : 'DRAFT';
              return (
                <TouchableOpacity
                  key={project.id}
                  onPress={() => navigate('project', { id: project.id, name: project.name })}
                  style={{ backgroundColor: colors.bg2, borderWidth: 1, borderTopColor: colors.bevelLight, borderLeftColor: colors.bevelLight, borderBottomColor: colors.bevelDark, borderRightColor: colors.bevelDark, padding: 16 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Feather name="folder" size={13} color={colors.accent} />
                        <Text style={{ color: colors.textStrong, fontFamily: 'monospace', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{project.name}</Text>
                      </View>
                      <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 10, marginLeft: 21 }} numberOfLines={1}>{project.base_url ?? '—'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginLeft: 21 }}>
                        <StepDots current={step} colors={colors} />
                        <Text style={{ color: stepColor, fontFamily: 'monospace', fontSize: 9, letterSpacing: 1 }}>{stepLabel}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Feather name="chevron-right" size={13} color={colors.textDim} />
                      <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 9 }}>step {step}/3</Text>
                    </View>
                  </View>
                  {step < 3 ? (
                    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Feather name="arrow-right" size={10} color={colors.textDim} />
                      <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 10 }}>
                        {step === 1 ? 'Next: upload your OpenAPI spec' : 'Next: preview & build your CLI'}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
