// Replayable "Computer" panel (specs/current/task-progress-and-computer-replay.zh-CN.md §3.4).
//
// An activity-replay theater over the CURRENT round's steps. All the detail the
// minimal chat leaves out lives here: each important action is a step you can
// scrub through (◀ ▶ / slider), with ● Live + Jump-to-live while the run is
// active. Step content reuses the existing ToolCard family cards (search list /
// read detail / plan / write), so the Computer and the transcript never drift.

import { useMemo, useState } from 'react';
import type { PersistedAgentEvent } from '@open-design/contracts';
import { useT } from '../i18n';
import {
  computerStepsFromEvents,
  taskStepBrief,
  taskStepGlyph,
  type ComputerStep,
  type TaskRunStatus,
} from '../runtime/task-steps';
import { ToolCard } from './ToolCard';
import styles from './OdComputerPanel.module.css';

export type OdComputerVariant = 'side' | 'modal';

export function OdComputerPanel({
  events,
  live,
  status = null,
  variant,
  projectFileNames,
  onRequestOpenFile,
  onToggleView,
  onClose,
}: {
  /** The round's persisted agent events (from the assistant message). */
  events: PersistedAgentEvent[] | undefined;
  /** True while the round's run is still producing steps. */
  live: boolean;
  status?: TaskRunStatus;
  variant: OdComputerVariant;
  projectFileNames?: Set<string>;
  onRequestOpenFile?: (name: string) => void;
  /** Toggle between docked side view and the global modal. */
  onToggleView?: () => void;
  onClose?: () => void;
}) {
  const t = useT();
  const steps = useMemo(() => computerStepsFromEvents(events), [events]);
  const total = steps.length;

  // `-1` = follow live (pinned to the newest step); any other value locks the
  // scrubber to a past step the user is inspecting.
  const [selected, setSelected] = useState(-1);
  const following = selected < 0;
  const index = total === 0 ? -1 : following ? total - 1 : Math.min(selected, total - 1);
  const active = index >= 0 ? steps[index] : undefined;

  const goPrev = () => {
    if (index > 0) setSelected(index - 1);
  };
  const goNext = () => {
    if (total === 0 || index >= total - 1) return;
    const next = index + 1;
    setSelected(next >= total - 1 ? -1 : next);
  };
  const onScrub = (raw: number) => {
    if (raw >= total - 1) setSelected(-1);
    else setSelected(raw);
  };

  return (
    <section className={styles.root} data-testid="od-computer-panel" data-variant={variant}>
      <header className={styles.header}>
        <span className={styles.badge} aria-hidden>
          <ComputerGlyph />
        </span>
        <div className={styles.titles}>
          <span className={styles.title}>{t('task.computer.title')}</span>
          <span className={styles.status} data-testid="od-computer-status">
            {active ? taskStepBrief(active.step, t) : t('task.computer.empty')}
          </span>
        </div>
        <div className={styles.headerActions}>
          {onToggleView ? (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onToggleView}
              aria-label={
                variant === 'side' ? t('task.computer.expand') : t('task.computer.sideView')
              }
              title={
                variant === 'side' ? t('task.computer.expand') : t('task.computer.sideView')
              }
            >
              {variant === 'side' ? <ExpandGlyph /> : <DockGlyph />}
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
              <CloseGlyph />
            </button>
          ) : null}
        </div>
      </header>

      <div className={styles.body} data-testid="od-computer-body">
        {active ? (
          <StepBody
            computer={active}
            live={live}
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
          <StepChevron dir="prev" />
        </button>
        <button
          type="button"
          className={styles.stepBtn}
          onClick={goNext}
          disabled={total === 0 || index >= total - 1}
          aria-label={t('task.computer.nextStep')}
        >
          <StepChevron dir="next" />
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
          live ? (
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
            onClick={() => setSelected(-1)}
            data-testid="od-computer-jump-live"
          >
            <span className={styles.liveDot} data-live={live} aria-hidden />
            {t('task.computer.jumpToLive')}
          </button>
        )}
      </div>
    </section>
  );
}

function StepBody({
  computer,
  live,
  projectFileNames,
  onRequestOpenFile,
}: {
  computer: ComputerStep;
  live: boolean;
  projectFileNames?: Set<string>;
  onRequestOpenFile?: (name: string) => void;
}) {
  const t = useT();
  const { step, use, result } = computer;
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
          {taskStepGlyph('generate')}
        </span>
        <span className={styles.artifactName}>{name}</span>
        <span className={styles.artifactOpen}>{t('task.deliverable.open')}</span>
      </button>
    );
  }
  return <div className={styles.generic}>{taskStepBrief(step, t)}</div>;
}

function ComputerGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
      <rect x="1.5" y="2.5" width="13" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 14h5M8 11.5V14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ExpandGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
      <path
        d="M6 2.5H2.5V6M10 13.5H13.5V10M13.5 6V2.5H10M2.5 10v3.5H6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DockGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="10" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 3v10" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function StepChevron({ dir }: { dir: 'prev' | 'next' }) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden>
      <path
        d={dir === 'prev' ? 'M10 3.5 5.5 8l4.5 4.5' : 'M6 3.5 10.5 8 6 12.5'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
