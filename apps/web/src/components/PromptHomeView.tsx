import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../i18n';
import type { Dict } from '../i18n/types';
import {
  DEFAULT_AUDIO_MODEL,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
} from '../media/models';
import { fetchMcpServers, type McpServerConfig } from '../state/mcp';
import { Icon } from './Icon';
import { navigate } from '../router';
import { AppChromeHeader, SettingsIconButton, type ChromeTab } from './AppChromeHeader';
import { DesignsTab } from './DesignsTab';
import { DesignSystemPreviewModal } from './DesignSystemPreviewModal';
import { DesignSystemsTab } from './DesignSystemsTab';
import { ExamplesTab } from './ExamplesTab';
import type { CreateInput, CreateTab } from './NewProjectPanel';
import { PromptTemplatePreviewModal } from './PromptTemplatePreviewModal';
import { PromptTemplatesTab } from './PromptTemplatesTab';
import type {
  ChatAttachment,
  DesignSystemSummary,
  Project,
  ProjectKind,
  ProjectMetadata,
  PromptTemplateSummary,
  SkillSummary,
} from '../types';

type DictKey = keyof Dict;
type TranslateFn = (key: keyof Dict, vars?: Record<string, string | number>) => string;
type HomeToolsTab = 'mcp' | 'import';

const PENDING_SETUP_KEY = 'od:setup-pending';
const PENDING_ATTACHMENTS_KEY = 'od:pending-attachments';
const HOME_MARK_IMAGES = ['/home-mark-4.png', '/home-mark.png', '/home-mark-2.png', '/home-mark-3.png'];

const TAB_LABEL_KEYS: Record<CreateTab, DictKey> = {
  prototype: 'newproj.tabPrototype',
  'live-artifact': 'newproj.tabLiveArtifact',
  deck: 'newproj.tabDeck',
  template: 'newproj.tabTemplate',
  image: 'newproj.surfaceImage',
  video: 'newproj.surfaceVideo',
  audio: 'newproj.surfaceAudio',
  other: 'newproj.tabOther',
};

// Cross-page handshake: the home page sets this flag right before
// navigating into the freshly-created project so ProjectView knows to
// render the project setup form (locked NewProjectPanel) inside chat
// instead of auto-firing the prompt.
export function markPendingSetup(): void {
  try {
    window.sessionStorage.setItem(PENDING_SETUP_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function consumePendingSetup(): boolean {
  try {
    if (window.sessionStorage.getItem(PENDING_SETUP_KEY) !== '1') return false;
    window.sessionStorage.removeItem(PENDING_SETUP_KEY);
    return true;
  } catch {
    return false;
  }
}

export function savePendingAttachments(attachments: ChatAttachment[]): void {
  try {
    if (attachments.length === 0) return;
    window.sessionStorage.setItem(PENDING_ATTACHMENTS_KEY, JSON.stringify(attachments));
  } catch {
    /* ignore */
  }
}

export function consumePendingAttachments(): ChatAttachment[] {
  try {
    const raw = window.sessionStorage.getItem(PENDING_ATTACHMENTS_KEY);
    if (!raw) return [];
    window.sessionStorage.removeItem(PENDING_ATTACHMENTS_KEY);
    return JSON.parse(raw) as ChatAttachment[];
  } catch {
    return [];
  }
}

interface Props {
  skills: SkillSummary[];
  designSystems: DesignSystemSummary[];
  projects: Project[];
  promptTemplates: PromptTemplateSummary[];
  defaultDesignSystemId: string | null;
  onCreateProject: (input: CreateInput & { pendingPrompt?: string; pendingFiles?: File[] }) => void;
  onChangeDefaultDesignSystem: (id: string) => void;
  onOpenProject: (id: string) => void;
  onOpenLiveArtifact: (projectId: string, artifactId: string) => void;
  onDeleteProject: (id: string) => void;
  onOpenSettings: () => void;
  onOpenMcpSettings?: () => void;
  onImportClaudeDesign?: (file: File) => Promise<void> | void;
  onImportFolder?: (baseDir: string) => Promise<void> | void;
  // Browser-tab strip wiring forwarded into AppChromeHeader. Owned by
  // App.tsx so all three top-level views share the same open-tabs list.
  chromeTabs: ChromeTab[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onRenameTab?: (id: string, title: string) => void | Promise<void>;
  onSelectHome?: () => void;
  onNewHome?: () => void;
}

export function PromptHomeView({
  skills,
  designSystems,
  projects,
  promptTemplates,
  defaultDesignSystemId,
  onCreateProject,
  onChangeDefaultDesignSystem,
  onOpenProject,
  onOpenLiveArtifact,
  onDeleteProject,
  onOpenSettings,
  onOpenMcpSettings,
  onImportClaudeDesign,
  onImportFolder,
  chromeTabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onRenameTab,
  onSelectHome,
  onNewHome,
}: Props) {
  const t = useT();
  const [tab, setTab] = useState<CreateTab>('prototype');
  const [libraryTab, setLibraryTab] = useState('designs');
  const [librarySearch, setLibrarySearch] = useState('');
  const [librarySearchOpen, setLibrarySearchOpen] = useState(false);
  const [previewSystemId, setPreviewSystemId] = useState<string | null>(null);
  const [previewPromptTemplate, setPreviewPromptTemplate] =
    useState<PromptTemplateSummary | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [editorEmpty, setEditorEmpty] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [homeMarkIndex, setHomeMarkIndex] = useState(0);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [toolsTab, setToolsTab] = useState<HomeToolsTab>('mcp');
  const [mcpServers, setMcpServers] = useState<McpServerConfig[]>([]);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const promptInputRef = useRef<HTMLDivElement | null>(null);
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const toolsTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setHomeMarkIndex((index) => (index + 1) % HOME_MARK_IMAGES.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const data = await fetchMcpServers();
      if (cancelled || !data) return;
      setMcpServers(data.servers.filter((server) => server.enabled));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableToolsTabs = useMemo<HomeToolsTab[]>(() => {
    const tabs: HomeToolsTab[] = [];
    if (onOpenMcpSettings) tabs.push('mcp');
    tabs.push('import');
    return tabs;
  }, [onOpenMcpSettings]);

  useEffect(() => {
    if (!toolsOpen) return;
    if (!availableToolsTabs.includes(toolsTab)) {
      const first = availableToolsTabs[0];
      if (first) setToolsTab(first);
    }
  }, [toolsOpen, availableToolsTabs, toolsTab]);

  useEffect(() => {
    if (!toolsOpen) return;
    function onPointer(e: MouseEvent) {
      const target = e.target as Node;
      if (toolsMenuRef.current?.contains(target)) return;
      if (toolsTriggerRef.current?.contains(target)) return;
      setToolsOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setToolsOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [toolsOpen]);

  // Stable blob URLs for image previews — revoked when files change or unmount.
  const fileUrls = useMemo(
    () => pendingFiles.map((f) => f.type.startsWith('image/') ? URL.createObjectURL(f) : null),
    [pendingFiles],
  );
  useEffect(() => () => { fileUrls.forEach((u) => u && URL.revokeObjectURL(u)); }, [fileUrls]);
  const [baseDir, setBaseDir] = useState('');
  const [importing, setImporting] = useState(false);
  const [importingFolder, setImportingFolder] = useState(false);
  const hasElectronPicker =
    typeof window !== 'undefined' && typeof window.electronAPI?.pickFolder === 'function';
  const previewSystem = designSystems.find((system) => system.id === previewSystemId) ?? null;

  async function handleImportPicked(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file || !onImportClaudeDesign) return;
    setImporting(true);
    try {
      await onImportClaudeDesign(file);
    } finally {
      setImporting(false);
    }
  }

  async function handleOpenFolder() {
    if (!onImportFolder) return;
    let pathToOpen: string;
    if (hasElectronPicker) {
      const picked = await window.electronAPI!.pickFolder!();
      if (!picked) return;
      pathToOpen = picked;
    } else {
      const trimmed = baseDir.trim();
      if (!trimmed) return;
      pathToOpen = trimmed;
    }
    setImportingFolder(true);
    try {
      await onImportFolder(pathToOpen);
    } finally {
      setImportingFolder(false);
    }
  }

  // Default skill picked from the active tab so the per-mode SKILL.md
  // is composed into the system prompt. Mirrors NewProjectPanel.skillIdForTab.
  const skillIdForTab = useMemo(() => {
    if (tab === 'other') return null;
    if (tab === 'prototype') {
      const list = skills.filter((s) => s.mode === 'prototype');
      return list.find((s) => s.defaultFor.includes('prototype'))?.id
        ?? list[0]?.id
        ?? null;
    }
    if (tab === 'live-artifact') {
      const exact = skills.find(
        (s) => s.id === 'live-artifact' || s.name === 'live-artifact',
      );
      if (exact) return exact.id;
      const prototypes = skills.filter((s) => s.mode === 'prototype');
      return prototypes.find((s) => s.defaultFor.includes('prototype'))?.id
        ?? prototypes[0]?.id
        ?? null;
    }
    if (tab === 'deck') {
      const list = skills.filter((s) => s.mode === 'deck');
      return list.find((s) => s.defaultFor.includes('deck'))?.id
        ?? list[0]?.id
        ?? null;
    }
    if (tab === 'image' || tab === 'video' || tab === 'audio') {
      const list = skills.filter((s) => s.mode === tab || s.surface === tab);
      return list.find((s) => s.defaultFor.includes(tab))?.id
        ?? list[0]?.id
        ?? null;
    }
    return null;
  }, [tab, skills]);

  function defaultMetadata(forTab: CreateTab): ProjectMetadata {
    const kind: ProjectKind = forTab === 'live-artifact' ? 'prototype' : forTab;
    if (forTab === 'live-artifact') {
      return { kind, intent: 'live-artifact' as const };
    }
    return { kind };
  }

  function placeholderName(forTab: CreateTab): string {
    const stamp = new Date().toLocaleDateString();
    return `${t(TAB_LABEL_KEYS[forTab])} · ${stamp}`;
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length > 0) {
      setPendingFiles((curr) => [...curr, ...files]);
    }
  }

  function removeFile(index: number) {
    const removed = pendingFiles[index];
    setPendingFiles((curr) => curr.filter((_, i) => i !== index));
    if (removed) {
      promptInputRef.current?.querySelectorAll<HTMLElement>('[data-file-ref]').forEach((node) => {
        if (node.dataset.fileRef === removed.name) node.remove();
      });
      refreshEditorEmpty();
    }
    setPreviewIndex(null);
  }

  function refreshEditorEmpty() {
    const editor = promptInputRef.current;
    if (!editor) {
      setEditorEmpty(true);
      return;
    }
    setEditorEmpty(editor.textContent?.trim().length === 0 && !editor.querySelector('[data-file-ref]'));
  }

  function focusEditorEnd() {
    const editor = promptInputRef.current;
    if (!editor) return;
    editor.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  function insertNodeAtSelection(node: Node) {
    const editor = promptInputRef.current;
    if (!editor) return;
    const selection = window.getSelection();
    let range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      editor.focus({ preventScroll: true });
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    range.deleteContents();
    range.insertNode(node);
    const spacer = document.createTextNode(' ');
    node.parentNode?.insertBefore(spacer, node.nextSibling);
    range.setStartAfter(spacer);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  function insertPlainTextAtSelection(text: string) {
    const editor = promptInputRef.current;
    if (!editor || text.length === 0) return;
    const selection = window.getSelection();
    let range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      editor.focus({ preventScroll: true });
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    range.deleteContents();
    const parts = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    parts.forEach((part, index) => {
      if (index > 0) {
        range.insertNode(document.createElement('br'));
        range.collapse(false);
      }
      if (part.length > 0) {
        range.insertNode(document.createTextNode(part));
        range.collapse(false);
      }
    });
    selection?.removeAllRanges();
    selection?.addRange(range);
    refreshEditorEmpty();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const files = Array.from(e.clipboardData.files ?? []);
    const text = e.clipboardData.getData('text/plain');
    if (files.length === 0 && !text) return;
    e.preventDefault();
    if (files.length > 0) {
      setPendingFiles((curr) => [...curr, ...files]);
    }
    if (text) {
      insertPlainTextAtSelection(text);
    } else {
      refreshEditorEmpty();
    }
  }

  function insertFileReference(file: File) {
    const chip = document.createElement('span');
    chip.className = 'od-prompt-home-capsule in-input';
    chip.contentEditable = 'false';
    chip.dataset.fileRef = file.name;
    chip.title = file.name;
    chip.setAttribute('data-testid', 'prompt-home-input-capsule');
    chip.innerHTML = `
      <span class="od-prompt-home-capsule-name"></span>
      <button type="button" class="od-prompt-home-capsule-remove" aria-label="Remove reference"></button>
    `;
    chip.querySelector('.od-prompt-home-capsule-name')!.textContent = file.name;
    const removeButton = chip.querySelector('.od-prompt-home-capsule-remove')!;
    removeButton.textContent = '×';
    removeButton.setAttribute('aria-label', `Remove reference ${file.name}`);
    insertNodeAtSelection(chip);
    refreshEditorEmpty();
    window.requestAnimationFrame(() => {
      promptInputRef.current?.focus({ preventScroll: true });
    });
  }

  function removeEditorReference(target: HTMLElement) {
    target.closest('[data-file-ref]')?.remove();
    refreshEditorEmpty();
    window.requestAnimationFrame(focusEditorEnd);
  }

  function promptFromEditor(): string {
    const editor = promptInputRef.current;
    if (!editor) return '';
    function read(node: ChildNode): string {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
      if (!(node instanceof HTMLElement)) return '';
      const fileRef = node.dataset.fileRef;
      if (fileRef) return ` @${fileRef} `;
      if (node.tagName === 'BR') return '\n';
      return Array.from(node.childNodes).map(read).join('');
    }
    return Array.from(editor.childNodes)
      .map(read)
      .join('')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\s+\n/g, '\n')
      .trim();
  }

  function handleSend() {
    const text = promptFromEditor();
    if (!text && pendingFiles.length === 0) return;
    // Hand off to ProjectView via sessionStorage — the project gets a
    // placeholder name + minimal metadata here; the real choices
    // (设计体系/精度/演讲备注/媒体模型/…) are collected from the user
    // in chat once they land in the project.
    markPendingSetup();
    onCreateProject({
      name: placeholderName(tab),
      skillId: skillIdForTab,
      designSystemId: null,
      metadata: defaultMetadata(tab),
      pendingPrompt: text || undefined,
      pendingFiles: pendingFiles.length > 0 ? pendingFiles : undefined,
    });
  }

  function metadataForSkill(skill: SkillSummary): ProjectMetadata {
    const kind = kindForSkill(skill);
    if (kind === 'prototype') {
      return { kind, fidelity: skill.fidelity ?? 'high-fidelity' };
    }
    if (kind === 'deck') {
      return {
        kind,
        speakerNotes:
          typeof skill.speakerNotes === 'boolean' ? skill.speakerNotes : false,
      };
    }
    if (kind === 'template') {
      return {
        kind,
        animations:
          typeof skill.animations === 'boolean' ? skill.animations : false,
      };
    }
    if (kind === 'image') {
      return { kind, imageModel: DEFAULT_IMAGE_MODEL, imageAspect: '1:1' };
    }
    if (kind === 'video') {
      return { kind, videoModel: DEFAULT_VIDEO_MODEL, videoAspect: '16:9', videoLength: 5 };
    }
    if (kind === 'audio') {
      return {
        kind,
        audioKind: 'speech',
        audioModel: DEFAULT_AUDIO_MODEL.speech,
        audioDuration: 10,
      };
    }
    return { kind: 'other' };
  }

  function kindForSkill(skill: SkillSummary): ProjectKind {
    if (skill.mode === 'deck') return 'deck';
    if (skill.mode === 'prototype') return 'prototype';
    if (skill.mode === 'template') return 'template';
    if (skill.mode === 'image' || skill.surface === 'image') return 'image';
    if (skill.mode === 'video' || skill.surface === 'video') return 'video';
    if (skill.mode === 'audio' || skill.surface === 'audio') return 'audio';
    return 'other';
  }

  function usePromptFromSkill(skill: SkillSummary) {
    markPendingSetup();
    onCreateProject({
      name: skill.name,
      skillId: skill.id,
      designSystemId: null,
      metadata: metadataForSkill(skill),
      pendingPrompt: skill.examplePrompt || skill.description,
    });
  }

  function renderLibraryTabContent(active: string) {
    if (active === 'examples') {
      return (
        <ExamplesTab
          skills={skills}
          onUsePrompt={usePromptFromSkill}
          searchQuery={librarySearch}
        />
      );
    }
    if (active === 'design-systems') {
      return (
        <DesignSystemsTab
          systems={designSystems}
          selectedId={defaultDesignSystemId}
          onSelect={onChangeDefaultDesignSystem}
          onPreview={setPreviewSystemId}
          searchQuery={librarySearch}
        />
      );
    }
    if (active === 'image-templates') {
      return (
        <PromptTemplatesTab
          surface="image"
          templates={promptTemplates}
          onPreview={setPreviewPromptTemplate}
          searchQuery={librarySearch}
        />
      );
    }
    if (active === 'video-templates') {
      return (
        <PromptTemplatesTab
          surface="video"
          templates={promptTemplates}
          onPreview={setPreviewPromptTemplate}
          searchQuery={librarySearch}
        />
      );
    }
    if (active === 'examples') return null;
    return null;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="od-prompt-home">
      <AppChromeHeader
        tabs={chromeTabs}
        activeTabId={activeTabId}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        onRenameTab={onRenameTab}
        onSelectHome={onSelectHome}
        onNewHome={() => {
          onNewHome?.();
          if (!onNewHome) navigate({ kind: 'prompt-home' });
          setTab('prototype');
          setLibraryTab('designs');
          setLibrarySearch('');
          setLibrarySearchOpen(false);
          if (promptInputRef.current) promptInputRef.current.textContent = '';
          setPendingFiles([]);
          setEditorEmpty(true);
        }}
        actions={(
          <SettingsIconButton
            onClick={onOpenSettings}
            title={t('settings.kicker')}
            ariaLabel={t('settings.kicker')}
          />
        )}
      />

      <div className="od-prompt-home-main">
        <div className="od-prompt-home-fold">
          <div className="od-prompt-home-hero-image" aria-hidden>
            <img className="od-prompt-home-hero-mark" src={HOME_MARK_IMAGES[homeMarkIndex]} alt="" />
            <img className="od-prompt-home-hero-wordmark" src="/home-wordmark.svg" alt="" />
          </div>
          <div className="od-prompt-home-tabs" role="tablist">
            {(Object.keys(TAB_LABEL_KEYS) as CreateTab[]).map((entry) => (
              <button
                key={entry}
                type="button"
                role="tab"
                aria-selected={tab === entry}
                data-testid={`prompt-home-tab-${entry}`}
                className={`od-prompt-home-tab${tab === entry ? ' active' : ''}`}
                onClick={() => setTab(entry)}
              >
                {t(TAB_LABEL_KEYS[entry])}
              </button>
            ))}
          </div>

          <div
            className={`od-prompt-home-composer${isDragging ? ' drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div
              ref={promptInputRef}
              className={`od-prompt-home-input${editorEmpty ? ' empty' : ''}`}
              data-testid="prompt-home-input"
              data-placeholder={t('chat.composerPlaceholder')}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              onInput={refreshEditorEmpty}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                refreshEditorEmpty();
              }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('od-prompt-home-capsule-remove')) {
                  e.preventDefault();
                  e.stopPropagation();
                  removeEditorReference(target);
                }
              }}
              onMouseDown={(e) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('od-prompt-home-capsule-remove')) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            />
            <div className="od-prompt-home-composer-foot">
              {pendingFiles.length > 0 ? (
                <div className="od-prompt-home-capsules">
                  {pendingFiles.map((file, i) => (
                    <button
                      key={`${file.name}-${i}`}
                      type="button"
                      className={`od-prompt-home-capsule${isFocused ? ' focused' : ''}`}
                      onMouseDown={(e) => { if (isFocused) e.preventDefault(); }}
                      onClick={() => {
                        if (isFocused) {
                          insertFileReference(file);
                        } else {
                          setPreviewIndex(i);
                        }
                      }}
                      title={file.name}
                    >
                      {fileUrls[i] && (
                        <img className="od-prompt-home-capsule-thumb" src={fileUrls[i]!} alt="" />
                      )}
                      <span className="od-prompt-home-capsule-name">{file.name}</span>
                      <span
                        className="od-prompt-home-capsule-remove"
                        role="button"
                        tabIndex={-1}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }}
                        aria-label={`Remove ${file.name}`}
                      >×</span>
                    </button>
                  ))}
                </div>
              ) : (
                <span className="od-prompt-home-hint">{t('chat.composerHint')}</span>
              )}
              <div className="od-prompt-home-foot-actions">
                {onImportClaudeDesign ? (
                  <>
                    <input
                      ref={importInputRef}
                      type="file"
                      accept=".zip,application/zip"
                      hidden
                      onChange={handleImportPicked}
                    />
                    <button
                      type="button"
                      className="od-prompt-home-foot-icon"
                      data-testid="prompt-home-import-zip"
                      disabled={importing}
                      title={importing ? t('newproj.importingClaudeZip') : t('newproj.importClaudeZipTitle')}
                      aria-label={t('newproj.importClaudeZip')}
                      onClick={() => importInputRef.current?.click()}
                    >
                      <Icon name="import" size={14} />
                    </button>
                  </>
                ) : null}
                {onImportFolder ? (
                  <button
                    type="button"
                    className="od-prompt-home-foot-icon"
                    data-testid="prompt-home-open-folder"
                    disabled={(!hasElectronPicker && !baseDir.trim()) || importingFolder}
                    title={importingFolder ? 'Opening…' : 'Open folder'}
                    aria-label="Open folder"
                    onClick={() => void handleOpenFolder()}
                  >
                    <Icon name="folder" size={14} />
                  </button>
                ) : null}
                <div className="composer-tools-wrap">
                  <button
                    ref={toolsTriggerRef}
                    type="button"
                    className={`od-prompt-home-foot-icon composer-tools-trigger${toolsOpen ? ' active' : ''}`}
                    data-testid="prompt-home-cli-settings"
                    title={t('chat.cliSettingsTitle')}
                    aria-haspopup="menu"
                    aria-expanded={toolsOpen}
                    aria-label={t('chat.cliSettingsAria')}
                    onClick={() => setToolsOpen((open) => !open)}
                  >
                    <Icon name="sliders" size={14} />
                    {mcpServers.length > 0 ? (
                      <span className="composer-tools-badge">{mcpServers.length}</span>
                    ) : null}
                  </button>
                  {toolsOpen ? (
                    <div
                      ref={toolsMenuRef}
                      className="composer-tools-menu od-prompt-home-tools-menu"
                      role="menu"
                    >
                      <div className="composer-tools-tabs" role="tablist">
                        {availableToolsTabs.map((entry) => (
                          <button
                            key={entry}
                            type="button"
                            role="tab"
                            aria-selected={toolsTab === entry}
                            className={`composer-tools-tab${toolsTab === entry ? ' active' : ''}`}
                            onClick={() => setToolsTab(entry)}
                          >
                            {entry === 'mcp' ? (
                              <>
                                <Icon name="link" size={12} />
                                <span>MCP</span>
                                {mcpServers.length > 0 ? (
                                  <span className="composer-tools-tab-count">{mcpServers.length}</span>
                                ) : null}
                              </>
                            ) : (
                              <>
                                <Icon name="import" size={12} />
                                <span>{t('chat.importLabel')}</span>
                              </>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="composer-tools-content">
                        {toolsTab === 'mcp' && onOpenMcpSettings ? (
                          <HomeToolsMcpPanel
                            servers={mcpServers}
                            onInsert={(serverId) => {
                              insertPlainTextAtSelection(`Use the \`${serverId}\` MCP server tools. `);
                              setToolsOpen(false);
                            }}
                            onManage={() => {
                              setToolsOpen(false);
                              onOpenMcpSettings();
                            }}
                          />
                        ) : null}
                        {toolsTab === 'import' ? (
                          <HomeToolsImportPanel
                            t={t}
                            onLinkFolder={async () => {
                              setToolsOpen(false);
                              await handleOpenFolder();
                            }}
                            folderEnabled={Boolean(onImportFolder && (hasElectronPicker || baseDir.trim()))}
                          />
                        ) : null}
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        className="composer-tools-settings"
                        onClick={() => {
                          setToolsOpen(false);
                          onOpenSettings();
                        }}
                      >
                        <Icon name="settings" size={13} />
                        <span>{t('pet.composerOpenSettings')}</span>
                      </button>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="primary od-prompt-home-send"
                  data-testid="prompt-home-send"
                  onClick={handleSend}
                  disabled={editorEmpty && pendingFiles.length === 0}
                >
                  <Icon name="send" size={13} />
                  <span>{t('chat.send')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {projects.length > 0 ? (
          <div className="od-prompt-home-projects">
            <DesignsTab
              projects={projects}
              skills={skills}
              designSystems={designSystems}
              onOpen={onOpenProject}
              onOpenLiveArtifact={onOpenLiveArtifact}
              onDelete={onDeleteProject}
              hideSubTabs
              activeTopTab={libraryTab}
              onTopTabChange={setLibraryTab}
              filterValue={librarySearch}
              onFilterChange={setLibrarySearch}
              filterCollapsed={!librarySearchOpen && librarySearch.trim().length === 0}
              onFilterOpen={() => setLibrarySearchOpen(true)}
              onFilterBlur={() => {
                if (librarySearch.trim().length === 0) setLibrarySearchOpen(false);
              }}
              homeEmbedded
              renderTopTabContent={renderLibraryTabContent}
            />
          </div>
        ) : null}
      </div>

      {previewIndex !== null && pendingFiles[previewIndex] && (
        <div
          className="od-prompt-home-preview-overlay"
          onClick={() => setPreviewIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="od-prompt-home-preview"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="od-prompt-home-preview-close"
              onClick={() => setPreviewIndex(null)}
              aria-label="Close"
            >×</button>
            {fileUrls[previewIndex] ? (
              <img
                className="od-prompt-home-preview-img"
                src={fileUrls[previewIndex]!}
                alt={pendingFiles[previewIndex].name}
              />
            ) : (
              <div className="od-prompt-home-preview-file">
                <span className="od-prompt-home-preview-filename">
                  {pendingFiles[previewIndex].name}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      {previewSystem ? (
        <DesignSystemPreviewModal
          system={previewSystem}
          onClose={() => setPreviewSystemId(null)}
        />
      ) : null}
      {previewPromptTemplate ? (
        <PromptTemplatePreviewModal
          summary={previewPromptTemplate}
          onClose={() => setPreviewPromptTemplate(null)}
        />
      ) : null}
    </div>
  );
}

function HomeToolsMcpPanel({
  servers,
  onInsert,
  onManage,
}: {
  servers: McpServerConfig[];
  onInsert: (serverId: string) => void;
  onManage: () => void;
}) {
  return (
    <>
      {servers.length === 0 ? (
        <div className="composer-tools-empty">
          No MCP servers configured yet. Open Settings to add Higgsfield,
          GitHub, Filesystem, or a custom server.
        </div>
      ) : (
        <div className="composer-tools-list">
          {servers.map((s) => (
            <button
              key={s.id}
              type="button"
              role="menuitem"
              className="composer-tools-row"
              onClick={() => onInsert(s.id)}
              title={`Insert a hint that nudges the model to use ${s.label || s.id}`}
            >
              <Icon name="link" size={12} />
              <span className="composer-tools-row-body">
                <strong>{s.label || s.id}</strong>
                <span className="composer-tools-row-meta">{s.transport}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        role="menuitem"
        className="composer-tools-row composer-tools-row-action"
        onClick={onManage}
      >
        <Icon name="settings" size={12} />
        <span>Manage MCP servers…</span>
      </button>
    </>
  );
}

function HomeToolsImportPanel({
  t,
  onLinkFolder,
  folderEnabled,
}: {
  t: TranslateFn;
  onLinkFolder: () => Promise<void> | void;
  folderEnabled: boolean;
}) {
  return (
    <div className="composer-tools-list">
      <button
        type="button"
        className={`composer-import-item${folderEnabled ? ' composer-import-item-enabled' : ''}`}
        role="menuitem"
        disabled={!folderEnabled}
        title={folderEnabled ? t('chat.importFolder') : t('chat.importComingSoon')}
        onClick={folderEnabled ? () => void onLinkFolder() : (e) => e.preventDefault()}
      >
        <span className="ico" aria-hidden>
          <Icon name="folder" size={14} />
        </span>
        <span className="composer-import-item-label">{t('chat.importFolder')}</span>
        {!folderEnabled && <span className="composer-import-item-soon">{t('chat.importSoon')}</span>}
      </button>
    </div>
  );
}
