import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from './Sidebar';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '../context/NavigationContext';
import { api } from '../utils/api';
import { supabase } from '../utils/supabase';
import Win98Button from './Win98Button';
import Win98Input from './Win98Input';

export function AppSidebar() {
  const { open } = useSidebar();
  const { theme, toggle, colors } = useTheme();
  const { screen, params, navigate, newProjectSeq } = useNavigation();

  useEffect(() => {
    if (newProjectSeq > 0) setShowNewProject(true);
  }, [newProjectSeq]);

  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectUrl, setNewProjectUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    loadProjects();
    loadUser();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.listProjects();
      setProjects(Array.isArray(data) ? data : (data.projects ?? []));
    } catch {}
  };

  const loadUser = async () => {
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
    } catch {}
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !newProjectUrl.trim()) {
      setCreateError('Name and base URL required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const created = await api.createProject({
        name: newProjectName.trim(),
        base_url: newProjectUrl.trim(),
      });
      await loadProjects();
      setShowNewProject(false);
      setNewProjectName('');
      setNewProjectUrl('');
      if (created?.id) {
        navigate('project', { id: created.id, name: created.name ?? newProjectName.trim() });
      }
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const closeModal = () => {
    setShowNewProject(false);
    setCreateError('');
    setNewProjectName('');
    setNewProjectUrl('');
  };

  const filteredProjects = searchQuery
    ? projects.filter((p) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : projects;

  const userLabel = user?.email?.split('@')[0] ?? 'User';
  const userInitial = userLabel[0]?.toUpperCase() ?? 'U';
  const avatarUrl =
    user?.user_metadata?.avatar_url ??
    user?.user_metadata?.picture ??
    null;

  return (
    <>
      <Sidebar>
        {/* Logo + collapse trigger */}
        <SidebarHeader>
          {open ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text
                  style={{
                    color: colors.textStrong,
                    fontFamily: 'monospace',
                    fontSize: 14,
                    fontWeight: '700',
                    letterSpacing: 2,
                  }}
                >
                  ÆTHRON
                </Text>
                <Text style={{ color: colors.accent, fontFamily: 'monospace', fontSize: 14, fontWeight: '700' }}>
                  .
                </Text>
              </View>
              <SidebarTrigger />
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <SidebarTrigger />
            </View>
          )}
        </SidebarHeader>

        <SidebarContent>
          {/* + New Project */}
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  icon={<Feather name="plus" size={14} color={colors.accent} />}
                  label="New Project"
                  onPress={() => setShowNewProject(true)}
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {/* Search — inline input when expanded, icon-only when collapsed */}
          <SidebarGroup>
            {open ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginHorizontal: 10,
                  marginBottom: 4,
                  borderWidth: 1,
                  borderTopColor: colors.bevelDark,
                  borderLeftColor: colors.bevelDark,
                  borderBottomColor: colors.bevelLight,
                  borderRightColor: colors.bevelLight,
                  backgroundColor: colors.inputBg,
                  paddingHorizontal: 8,
                  height: 28,
                  gap: 6,
                }}
              >
                <Feather name="search" size={11} color={colors.textDim} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search projects..."
                  placeholderTextColor={colors.textDim}
                  style={{
                    flex: 1,
                    color: colors.text,
                    fontFamily: 'monospace',
                    fontSize: 11,
                    padding: 0,
                    margin: 0,
                    outlineStyle: 'none',
                  }}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>
            ) : (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={
                      <Feather name="search" size={14} color={colors.textMid} />
                    }
                    onPress={() => {}}
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </SidebarGroup>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginHorizontal: 12,
              marginVertical: 4,
            }}
          />

          {/* Dashboard */}
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  icon={
                    <Feather
                      name="grid"
                      size={14}
                      color={screen === 'dashboard' ? colors.accent : colors.textMid}
                    />
                  }
                  label="Dashboard"
                  isActive={screen === 'dashboard'}
                  onPress={() => navigate('dashboard')}
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginHorizontal: 12,
              marginVertical: 4,
            }}
          />

          {/* Projects list */}
          <SidebarGroup>
            <SidebarGroupLabel>PROJECTS</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredProjects.length === 0 ? (
                  open ? (
                    <Text
                      style={{
                        color: colors.textDim,
                        fontFamily: 'monospace',
                        fontSize: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        fontStyle: 'italic',
                      }}
                    >
                      No projects yet
                    </Text>
                  ) : null
                ) : (
                  filteredProjects.map((project) => {
                    const isActive = screen === 'project' && params.id === project.id;
                    return (
                      <SidebarMenuItem key={project.id}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ flex: 1 }}>
                            <SidebarMenuButton
                              icon={
                                <Feather
                                  name="folder"
                                  size={13}
                                  color={isActive ? colors.accent : colors.textMid}
                                />
                              }
                              label={project.name}
                              isActive={isActive}
                              onPress={() =>
                                navigate('project', { id: project.id, name: project.name })
                              }
                            />
                          </View>
                          {open ? (
                            <TouchableOpacity
                              onPress={async () => {
                                try {
                                  await api.deleteProject(project.id);
                                  if (isActive) navigate('dashboard');
                                  await loadProjects();
                                } catch {}
                              }}
                              style={{ padding: 8 }}
                              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                            >
                              <Feather name="trash-2" size={11} color={colors.textDim} />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </SidebarMenuItem>
                    );
                  })
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginHorizontal: 12,
              marginVertical: 4,
            }}
          />

          {/* Sandbox */}
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  icon={
                    <Feather
                      name="terminal"
                      size={14}
                      color={
                        screen === 'sandbox' || screen === 'sandbox-session'
                          ? colors.accent
                          : colors.textMid
                      }
                    />
                  }
                  label="Sandbox"
                  isActive={
                    screen === 'sandbox' || screen === 'sandbox-session'
                  }
                  onPress={() => navigate('sandbox')}
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        {/* User footer */}
        <SidebarFooter>
          {/* Theme toggle */}
          <TouchableOpacity
            onPress={toggle}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderTopColor: colors.bevelLight,
                borderLeftColor: colors.bevelLight,
                borderBottomColor: colors.bevelDark,
                borderRightColor: colors.bevelDark,
                backgroundColor: colors.bg3,
                flexShrink: 0,
              }}
            >
              <Feather
                name={theme === 'dark' ? 'sun' : 'moon'}
                size={12}
                color={colors.textMid}
              />
            </View>
            {open && (
              <Text
                style={{
                  color: colors.textMid,
                  fontFamily: 'monospace',
                  fontSize: 11,
                }}
              >
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign out */}
          <TouchableOpacity
            onPress={() => supabase.auth.signOut()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                backgroundColor: colors.accentDim,
                borderWidth: 1,
                borderTopColor: colors.bevelLight,
                borderLeftColor: colors.bevelLight,
                borderBottomColor: colors.bevelDark,
                borderRightColor: colors.bevelDark,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 26, height: 26 }}
                  resizeMode="cover"
                />
              ) : (
                <Text
                  style={{
                    color: colors.accent,
                    fontFamily: 'monospace',
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {userInitial}
                </Text>
              )}
            </View>
            {open && (
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text
                  style={{
                    color: colors.textMid,
                    fontFamily: 'monospace',
                    fontSize: 11,
                  }}
                  numberOfLines={1}
                >
                  {userLabel}
                </Text>
                <Feather name="log-out" size={11} color={colors.textDim} />
              </View>
            )}
          </TouchableOpacity>
        </SidebarFooter>
      </Sidebar>

      {/* New Project modal */}
      <Modal visible={showNewProject} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.bg2,
              borderWidth: 1,
              borderTopColor: colors.bevelLight,
              borderLeftColor: colors.bevelLight,
              borderBottomColor: colors.bevelDark,
              borderRightColor: colors.bevelDark,
              width: '100%',
              maxWidth: 360,
            }}
          >
            {/* Win98 title bar */}
            <View
              style={{
                backgroundColor: colors.accent,
                paddingHorizontal: 10,
                paddingVertical: 5,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#001a0d',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 0.3,
                }}
              >
                New Project
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <View
                  style={{
                    width: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.accent,
                    borderWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.5)',
                    borderLeftColor: 'rgba(255,255,255,0.5)',
                    borderBottomColor: 'rgba(0,0,0,0.4)',
                    borderRightColor: 'rgba(0,0,0,0.4)',
                  }}
                >
                  <Text
                    style={{
                      color: '#001a0d',
                      fontSize: 8,
                      fontFamily: 'monospace',
                      fontWeight: '700',
                      lineHeight: 11,
                    }}
                  >
                    ✕
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ padding: 18 }}>
              <Win98Input
                label="Project Name"
                placeholder="my-api-cli"
                value={newProjectName}
                onChangeText={setNewProjectName}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <Win98Input
                label="Base URL"
                placeholder="https://api.example.com"
                value={newProjectUrl}
                onChangeText={setNewProjectUrl}
                autoCorrect={false}
                autoCapitalize="none"
                keyboardType="url"
              />

              {createError ? (
                <Text
                  style={{
                    color: colors.red,
                    fontFamily: 'monospace',
                    fontSize: 10,
                    marginBottom: 12,
                  }}
                >
                  ⚠ {createError}
                </Text>
              ) : null}

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <Win98Button
                  title="Cancel"
                  variant="secondary"
                  onPress={closeModal}
                />
                <Win98Button
                  title="Create →"
                  onPress={handleCreateProject}
                  loading={creating}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
