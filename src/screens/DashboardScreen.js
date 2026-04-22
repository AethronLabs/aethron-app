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

const STEPS = [
  {
    num: '01',
    icon: 'upload',
    title: 'Upload Spec',
    desc: 'Paste your OpenAPI YAML or JSON',
  },
  {
    num: '02',
    icon: 'terminal',
    title: 'Generate Commands',
    desc: 'AI maps endpoints to CLI commands',
  },
  {
    num: '03',
    icon: 'package',
    title: 'Build & Ship',
    desc: 'Download a ready-to-use Rust CLI',
  },
];

function projectStep(project) {
  if (project.status === 'published' || project.status === 'building') return 3;
  if (project.spec_uploaded_at) return 2;
  return 1;
}

function StepDots({ current, colors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {[1, 2, 3].map((s) => (
        <View
          key={s}
          style={{
            width: s <= current ? 16 : 6,
            height: 6,
            backgroundColor: s <= current ? colors.accent : colors.border,
          }}
        />
      ))}
    </View>
  );
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { navigate } = useNavigation();
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
      contentContainerStyle={{ padding: 20, gap: 24 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.accent} />
      }
    >
      {/* Header */}
      <View>
        <Text style={{ color: colors.textStrong, fontFamily: 'monospace', fontSize: 18, fontWeight: '700', letterSpacing: 1 }}>
          ÆTHRON
        </Text>
        <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 10, marginTop: 3 }}>
          Turn your OpenAPI spec into a Rust CLI — in three steps.
        </Text>
      </View>

      {/* Workflow steps */}
      <View
        style={{
          backgroundColor: colors.bg2,
          borderWidth: 1,
          borderTopColor: colors.bevelLight,
          borderLeftColor: colors.bevelLight,
          borderBottomColor: colors.bevelDark,
          borderRightColor: colors.bevelDark,
          overflow: 'hidden',
        }}
      >
        {/* Title bar */}
        <View
          style={{
            backgroundColor: colors.bg3,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingHorizontal: 12,
            paddingVertical: 7,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <View style={{ width: 7, height: 7, backgroundColor: colors.accent }} />
          <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 9, letterSpacing: 2 }}>
            HOW IT WORKS
          </Text>
        </View>

        <View style={{ padding: 16, gap: 0 }}>
          {STEPS.map((step, i) => (
            <View key={step.num}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 12 }}>
                {/* Number */}
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderWidth: 1,
                    borderTopColor: colors.bevelLight,
                    borderLeftColor: colors.bevelLight,
                    borderBottomColor: colors.bevelDark,
                    borderRightColor: colors.bevelDark,
                    backgroundColor: colors.bg3,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ color: colors.accent, fontFamily: 'monospace', fontSize: 10, fontWeight: '700' }}>
                    {step.num}
                  </Text>
                </View>
                <View style={{ flex: 1, paddingTop: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <Feather name={step.icon} size={12} color={colors.accent} />
                    <Text style={{ color: colors.textStrong, fontFamily: 'monospace', fontSize: 12, fontWeight: '700' }}>
                      {step.title}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 10, lineHeight: 16 }}>
                    {step.desc}
                  </Text>
                </View>
              </View>
              {i < STEPS.length - 1 ? (
                <View style={{ flexDirection: 'row', paddingLeft: 15 }}>
                  <View style={{ width: 1, height: 12, backgroundColor: colors.border, marginLeft: 1 }} />
                  <Feather name="chevron-down" size={10} color={colors.border} style={{ marginLeft: -5, marginTop: 1 }} />
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      {/* Projects section */}
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 9, letterSpacing: 2, fontWeight: '700' }}>
            YOUR PROJECTS ({projects.length})
          </Text>
        </View>

        {projects.length === 0 ? (
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
              gap: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderWidth: 1,
                borderTopColor: colors.bevelLight,
                borderLeftColor: colors.bevelLight,
                borderBottomColor: colors.bevelDark,
                borderRightColor: colors.bevelDark,
                backgroundColor: colors.bg3,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="folder-plus" size={20} color={colors.textDim} />
            </View>
            <View style={{ alignItems: 'center', gap: 5 }}>
              <Text style={{ color: colors.textStrong, fontFamily: 'monospace', fontSize: 12, fontWeight: '700' }}>
                No projects yet
              </Text>
              <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 10, textAlign: 'center', lineHeight: 16 }}>
                Click "+ New Project" in the sidebar{'\n'}to create your first CLI project
              </Text>
            </View>
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 12,
                paddingVertical: 6,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Feather name="sidebar" size={11} color={colors.textDim} />
              <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 10 }}>
                sidebar → + New Project
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {projects.map((project) => {
              const step = projectStep(project);
              const stepLabel = step === 3 ? project.status?.toUpperCase() : step === 2 ? 'COMMANDS' : 'DRAFT';
              const stepColor = step === 3 ? colors.accent : step === 2 ? '#61afef' : colors.textDim;
              return (
                <TouchableOpacity
                  key={project.id}
                  onPress={() => navigate('project', { id: project.id, name: project.name })}
                  style={{
                    backgroundColor: colors.bg2,
                    borderWidth: 1,
                    borderTopColor: colors.bevelLight,
                    borderLeftColor: colors.bevelLight,
                    borderBottomColor: colors.bevelDark,
                    borderRightColor: colors.bevelDark,
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Feather name="folder" size={13} color={colors.accent} />
                        <Text style={{ color: colors.textStrong, fontFamily: 'monospace', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                          {project.name}
                        </Text>
                      </View>
                      <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 10, marginLeft: 21 }} numberOfLines={1}>
                        {project.base_url ?? '—'}
                      </Text>

                      {/* Progress */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginLeft: 21 }}>
                        <StepDots current={step} colors={colors} />
                        <Text style={{ color: stepColor, fontFamily: 'monospace', fontSize: 9, letterSpacing: 1 }}>
                          {stepLabel}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Feather name="chevron-right" size={13} color={colors.textDim} />
                      <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 9 }}>
                        step {step}/3
                      </Text>
                    </View>
                  </View>

                  {/* Next action hint */}
                  {step < 3 ? (
                    <View
                      style={{
                        marginTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        paddingTop: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
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

      {/* Quick links */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={() => navigate('sandbox')}
          style={{
            flex: 1,
            backgroundColor: colors.bg2,
            borderWidth: 1,
            borderTopColor: colors.bevelLight,
            borderLeftColor: colors.bevelLight,
            borderBottomColor: colors.bevelDark,
            borderRightColor: colors.bevelDark,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Feather name="terminal" size={14} color={colors.textMid} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textStrong, fontFamily: 'monospace', fontSize: 11, fontWeight: '700' }}>
              Sandbox
            </Text>
            <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 9, marginTop: 2 }}>
              Test CLIs in an isolated env
            </Text>
          </View>
          <Feather name="chevron-right" size={11} color={colors.textDim} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
