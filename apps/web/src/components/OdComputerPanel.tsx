// Replayable "Computer" panel (specs/current/task-progress-and-computer-replay.zh-CN.md §3.4).
//
// An activity-replay theater over the CURRENT round's steps. All the detail the
// minimal chat leaves out lives here: each important action is a step you can
// scrub through (◀ ▶ / slider), with ● Live + Jump-to-live while the run is
// active. Step content reuses the existing ToolCard family cards (search list /
// read detail / plan / write), so the Computer and the transcript never drift.

import { useEffect, useMemo, useState } from 'react';
import type { TrackingProjectKind } from '@open-design/contracts/analytics';
import { useT } from '../i18n';
import {
  computerStepsFromRound,
  taskStepBrief,
  taskStepTargetLabel,
  type ComputerStep,
  type TaskRound,
  type TaskStep,
} from '../runtime/task-steps';
import type { ProjectFile } from '../types';
import { FileViewer } from './FileViewer';
import { Icon } from './Icon';
import { ToolCard } from './ToolCard';
import styles from './OdComputerPanel.module.css';

export type OdComputerVariant = 'side' | 'modal';

export function OdComputerPanel({
  round,
  variant,
  initialStepId,
  projectId,
  projectKind,
  projectFiles = [],
  filesRefreshKey = 0,
  projectFileNames,
  onRequestOpenFile,
  onToggleView,
  onClose,
}: {
  round: TaskRound | null;
  variant: OdComputerVariant;
  initialStepId?: string;
  projectId?: string | null;
  projectKind?: TrackingProjectKind | null;
  projectFiles?: ProjectFile[];
  filesRefreshKey?: number;
  projectFileNames?: Set<string>;
  onRequestOpenFile?: (name: string) => void;
  /** Toggle between docked side view and the global modal. */
  onToggleView?: (stepId?: string) => void;
  onClose?: () => void;
}) {
  const t = useT();
  const steps = useMemo(() => computerStepsFromRound(round), [round]);
  const total = steps.length;

  // `null` = follow live. A concrete step id is a durable history lock: new
  // events may append to the round, but they never move the user's selection.
  // Index-based selection used to be reset whenever `steps` changed, which is
  // exactly what made a live run yank the scrubber back to the newest event.
  const [selectedStepId, setSelectedStepId] = useState<string | null>(initialStepId ?? null);
  const [progressCollapsed, setProgressCollapsed] = useState(false);
  useEffect(() => {
    setSelectedStepId(initialStepId ?? null);
  }, [initialStepId, round?.runId]);
  useEffect(() => {
    setProgressCollapsed(false);
  }, [round?.runId]);
  const selectedIndex = selectedStepId
    ? steps.findIndex(({ step }) => step.id === selectedStepId)
    : -1;
  const following = selectedStepId === null || selectedIndex < 0;
  const index = total === 0 ? -1 : following ? total - 1 : selectedIndex;
  const active = index >= 0 ? steps[index] : undefined;

  const goPrev = () => {
    if (index > 0) setSelectedStepId(steps[index - 1]?.step.id ?? null);
  };
  const goNext = () => {
    if (total === 0 || index >= total - 1) return;
    const next = index + 1;
    setSelectedStepId(next >= total - 1 ? null : (steps[next]?.step.id ?? null));
  };
  const onScrub = (raw: number) => {
    if (raw >= total - 1) setSelectedStepId(null);
    else setSelectedStepId(steps[raw]?.step.id ?? null);
  };

  return (
    <section className={styles.root} data-testid="od-computer-panel" data-variant={variant}>
      <header className={styles.header}>
        <span className={styles.badge} aria-hidden>
          <Icon name="present" size={16} />
        </span>
        <div className={styles.titles}>
          <span className={styles.title}>{t('task.computer.title')}</span>
          <span className={styles.status} data-testid="od-computer-status">
            {active
              ? `${t('brand.appliedToChat', { name: active.step.tool ?? taskStepBrief(active.step, t) })} · ${taskStepTargetLabel(active.step, t)}`
              : t('task.computer.empty')}
          </span>
        </div>
        <div className={styles.headerActions}>
          {onToggleView ? (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => onToggleView(following ? undefined : active?.step.id)}
              aria-label={
                variant === 'side' ? t('task.computer.expand') : t('task.computer.sideView')
              }
              title={
                variant === 'side' ? t('task.computer.expand') : t('task.computer.sideView')
              }
            >
              <Icon name={variant === 'side' ? 'maximize' : 'panel-left'} size={15} />
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onClose}
              aria-label={t('task.computer.close')}
              title={t('task.computer.close')}
            >
              <Icon name="close" size={14} />
            </button>
          ) : null}
        </div>
      </header>

      <div className={styles.body} data-testid="od-computer-body">
        {active ? (
          <StepBody
            computer={active}
            live={round?.live ?? false}
            projectId={projectId}
            projectKind={projectKind}
            projectFiles={projectFiles}
            filesRefreshKey={filesRefreshKey}
            projectFileNames={projectFileNames}
            onRequestOpenFile={onRequestOpenFile}
          />
        ) : (
          <div className={styles.empty}>{t('task.computer.empty')}</div>
        )}
      </div>

      <div className={styles.timeline}>
        <button
          type="button"
          className={styles.stepBtn}
          onClick={goPrev}
          disabled={index <= 0}
          aria-label={t('task.computer.prevStep')}
        >
          <Icon name="chevron-left" size={14} />
        </button>
        <button
          type="button"
          className={styles.stepBtn}
          onClick={goNext}
          disabled={total === 0 || index >= total - 1}
          aria-label={t('task.computer.nextStep')}
        >
          <Icon name="chevron-right" size={14} />
        </button>
        <input
          type="range"
          className={styles.scrubber}
          min={0}
          max={Math.max(0, total - 1)}
          value={index < 0 ? 0 : index}
          onChange={(event) => onScrub(Number(event.target.value))}
          disabled={total <= 1}
          aria-label={t('task.computer.stepCount', {
            current: index + 1,
            total: Math.max(total, 1),
          })}
          data-testid="od-computer-scrubber"
        />
        {following ? (
          round?.live ? (
            <span className={styles.liveState} data-testid="od-computer-live">
              <span className={styles.liveDot} aria-hidden />
              {t('task.computer.live')}
            </span>
          ) : (
            <span className={styles.count}>
              {total > 0
                ? t('task.computer.stepCount', { current: index + 1, total })
                : null}
            </span>
          )
        ) : (
          <button
            type="button"
            className={styles.jumpLive}
            onClick={() => setSelectedStepId(null)}
            data-testid="od-computer-jump-live"
          >
            <span className={styles.liveDot} data-live={round?.live ?? false} aria-hidden />
            {t('task.computer.jumpToLive')}
          </button>
        )}
      </div>
      <div
        className={styles.taskProgress}
        data-testid="od-computer-task-summary"
        data-collapsed={progressCollapsed}
      >
        <button
          type="button"
          className={styles.taskProgressToggle}
          aria-expanded={!progressCollapsed}
          aria-label={progressCollapsed ? t('designFiles.expandGroup') : t('designFiles.collapseGroup')}
          onClick={() => setProgressCollapsed((collapsed) => !collapsed)}
        >
          <span className={styles.taskProgressTitle}>{t('flow.title')}</span>
          <span className={round?.live ? styles.taskProgressLive : styles.taskProgressStatus}>
            {round?.live ? (
              <>
                <span className={styles.liveDot} aria-hidden />
                {t('task.computer.live')}
              </>
            ) : round?.status === 'failed' ? (
              t('task.status.failed')
            ) : round?.status === 'canceled' ? (
              t('task.status.stopped')
            ) : (
              t('task.status.completed')
            )}
          </span>
          <span className={styles.taskProgressCount}>
            {t('flow.stepOf', progressPosition(steps))}
          </span>
          <span className={styles.taskProgressChevron} data-collapsed={progressCollapsed} aria-hidden>
            <Icon name="chevron-down" size={14} />
          </span>
        </button>
        <div className={`accordion-collapsible ${styles.taskProgressBody}${progressCollapsed ? '' : ' open'}`}>
          <div className="accordion-collapsible-inner">
            <ComputerTaskProgress
              steps={steps}
              activeStepId={active?.step.id}
              onSelectStep={(stepId) => setSelectedStepId(stepId)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function progressPosition(steps: ComputerStep[]) {
  const activeIndex = steps.findIndex(({ step }) => step.status === 'running');
  return {
    current: Math.max(steps.length > 0 ? 1 : 0, activeIndex >= 0 ? activeIndex + 1 : steps.length),
    total: Math.max(steps.length, 1),
  };
}

function ComputerTaskProgress({
  steps,
  activeStepId,
  onSelectStep,
}: {
  steps: ComputerStep[];
  activeStepId?: string;
  onSelectStep: (stepId: string) => void;
}) {
  const t = useT();
  return (
    <ol className={styles.taskProgressList} data-testid="od-computer-task-steps">
      {steps.length > 0 ? (
        steps.map(({ step }) => (
          <li key={step.id} data-status={step.status} data-active={step.id === activeStepId}>
            <button type="button" onClick={() => onSelectStep(step.id)}>
              <StepStatusIcon status={step.status} />
              <span>{taskStepBrief(step, t)}</span>
            </button>
          </li>
        ))
      ) : (
        <li data-status="running" data-row="static">
          <StepStatusIcon status="running" />
          <span>{t('task.computer.empty')}</span>
        </li>
      )}
    </ol>
  );
}

function StepBody({
  computer,
  live,
  projectId,
  projectKind,
  projectFiles,
  filesRefreshKey,
  projectFileNames,
  onRequestOpenFile,
}: {
  computer: ComputerStep;
  live: boolean;
  projectId?: string | null;
  projectKind?: TrackingProjectKind | null;
  projectFiles: ProjectFile[];
  filesRefreshKey: number;
  projectFileNames?: Set<string>;
  onRequestOpenFile?: (name: string) => void;
}) {
  const t = useT();
  const { step, use, result } = computer;
  const artifactFile = findArtifactFile(projectFiles, step.artifact?.title ?? step.target);
  if (artifactFile && projectId && projectKind && ['generate', 'inspiration', 'outline', 'write', 'edit'].includes(step.kind)) {
    return (
      <div className={styles.artifactViewer} data-testid="od-computer-artifact-viewer">
        <FileViewer
          projectId={projectId}
          projectKind={projectKind}
          file={artifactFile}
          filesRefreshKey={filesRefreshKey}
          isDeck={artifactFile.kind === 'presentation'}
          streaming={live && step.status === 'running'}
        />
      </div>
    );
  }
  if (use) {
    return (
      <div className={styles.toolWrap}>
        <ToolCard
          use={use}
          result={result}
          runStreaming={live && step.status === 'running'}
          runSucceeded={step.status === 'done'}
          projectFileNames={projectFileNames}
          onRequestOpenFile={onRequestOpenFile}
        />
      </div>
    );
  }
  if (step.kind === 'thinking') {
    return <div className={styles.thinking}>{step.target}</div>;
  }
  if (step.kind === 'generate' && step.target) {
    const name = step.target;
    return (
      <button
        type="button"
        className={styles.artifact}
        onClick={() => onRequestOpenFile?.(name)}
        disabled={!onRequestOpenFile}
      >
        <span className={styles.artifactGlyph} aria-hidden>
          <Icon name="file" size={15} />
        </span>
        <span className={styles.artifactName}>{name}</span>
        <span className={styles.artifactOpen}>{t('task.deliverable.open')}</span>
      </button>
    );
  }
  return <div className={styles.generic}>{taskStepBrief(step, t)}</div>;
}

function StepStatusIcon({ status }: { status: TaskStep['status'] }) {
  return (
    <span className={styles.taskProgressMarker} data-status={status} aria-hidden>
      <Icon
        name={status === 'done' ? 'check' : status === 'error' ? 'close' : 'spinner'}
        size={13}
      />
    </span>
  );
}

function findArtifactFile(files: ProjectFile[], raw: string | undefined): ProjectFile | undefined {
  if (!raw) return undefined;
  const target = raw.replace(/^\.\//, '').replace(/\\/g, '/');
  return files.find((file) => {
    const name = (file.path || file.name).replace(/^\.\//, '').replace(/\\/g, '/');
    return name === target || name.endsWith(`/${target}`) || target.endsWith(`/${name}`);
  });
}
