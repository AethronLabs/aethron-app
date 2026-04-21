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

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { navigate } = useNavigation();
  const [projects, setProjects] = useState([]);
  const [sandboxStats, setSandboxStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    const [projectsRes, statsRes] = await Promise.allSettled([
      api.listProjects(),
      api.sandboxStats(),
    ]);
    if (projectsRes.status === 'fulfilled') {
      const d = projectsRes.value;
      setProjects(Array.isArray(d) ? d : (d.projects ?? []));
    }
    if (statsRes.status === 'fulfilled') {
      setSandboxStats(statsRes.value);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
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

  const statCards = [
    {
      label: 'PROJECTS',
      value: projects.length,
      icon: 'folder',
    },
    {
      label: 'ACTIVE SESSIONS',
      value: sandboxStats?.active_sessions ?? '—',
      icon: 'terminal',
    },
    {
      label: 'TOTAL SESSIONS',
      value: sandboxStats?.total_sessions ?? '—',
      icon: 'layers',
    },
  ];

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
      {/* Page header */}
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
          Dashboard
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
          OVERVIEW
        </Text>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
        {statCards.map((stat) => (
          <View
            key={stat.label}
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
            <Feather
              name={stat.icon}
              size={13}
              color={colors.accent}
              style={{ marginBottom: 8 }}
            />
            <Text
              style={{
                color: colors.textStrong,
                fontFamily: 'monospace',
                fontSize: 20,
                fontWeight: '700',
              }}
            >
              {stat.value}
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
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Projects section header */}
      <Text
        style={{
          color: colors.textDim,
          fontFamily: 'monospace',
          fontSize: 9,
          fontWeight: '700',
          letterSpacing: 2,
          marginBottom: 10,
        }}
      >
        PROJECTS
      </Text>

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
            gap: 10,
          }}
        >
          <Feather name="folder" size={22} color={colors.textDim} />
          <Text
            style={{
              color: colors.textDim,
              fontFamily: 'monospace',
              fontSize: 11,
              textAlign: 'center',
              lineHeight: 18,
            }}
          >
            {'No projects yet.\nUse "+ New Project" in the sidebar to get started.'}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              onPress={() =>
                navigate('project', { id: project.id, name: project.name })
              }
              style={{
                backgroundColor: colors.bg2,
                borderWidth: 1,
                borderTopColor: colors.bevelLight,
                borderLeftColor: colors.bevelLight,
                borderBottomColor: colors.bevelDark,
                borderRightColor: colors.bevelDark,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <Feather name="folder" size={16} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.textStrong,
                    fontFamily: 'monospace',
                    fontSize: 13,
                    fontWeight: '700',
                  }}
                >
                  {project.name}
                </Text>
                <Text
                  style={{
                    color: colors.textDim,
                    fontFamily: 'monospace',
                    fontSize: 10,
                    marginTop: 3,
                  }}
                  numberOfLines={1}
                >
                  {project.base_url ?? '—'}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {project.status ? (
                  <Text
                    style={{
                      color:
                        project.status === 'published'
                          ? colors.accent
                          : colors.textDim,
                      fontFamily: 'monospace',
                      fontSize: 8,
                      letterSpacing: 1,
                      borderWidth: 1,
                      borderColor:
                        project.status === 'published'
                          ? colors.accent
                          : colors.border,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    {project.status.toUpperCase()}
                  </Text>
                ) : null}
                <Feather name="chevron-right" size={13} color={colors.textDim} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
