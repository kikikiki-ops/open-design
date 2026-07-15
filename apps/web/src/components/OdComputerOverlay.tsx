// Presentation shell for the Computer panel (spec §3.4): a docked right-side
// drawer ("side view") or a centered modal, toggleable. Rendered via a portal
// so it floats above the project split without touching the workspace tabs.

import { createPortal } from 'react-dom';
import type { PersistedAgentEvent } from '@open-design/contracts';
import { OdComputerPanel, type OdComputerVariant } from './OdComputerPanel';
import type { TaskRunStatus } from '../runtime/task-steps';
import styles from './OdComputerOverlay.module.css';

export function OdComputerOverlay({
  open,
  variant,
  onVariantChange,
  onClose,
  events,
  live,
  status,
  projectFileNames,
  onRequestOpenFile,
}: {
  open: boolean;
  variant: OdComputerVariant;
  onVariantChange: (next: OdComputerVariant) => void;
  onClose: () => void;
  events: PersistedAgentEvent[] | undefined;
  live: boolean;
  status: TaskRunStatus;
  projectFileNames?: Set<string>;
  onRequestOpenFile?: (name: string) => void;
}) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={styles.layer}
      data-variant={variant}
      role="dialog"
      aria-modal={variant === 'modal'}
      aria-label="Computer"
    >
      {variant === 'modal' ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-hidden
          tabIndex={-1}
          onClick={onClose}
        />
      ) : null}
      <div className={styles.shell} data-variant={variant}>
        <OdComputerPanel
          events={events}
          live={live}
          status={status}
          variant={variant}
          projectFileNames={projectFileNames}
          onRequestOpenFile={onRequestOpenFile}
          onToggleView={() => onVariantChange(variant === 'side' ? 'modal' : 'side')}
          onClose={onClose}
        />
      </div>
    </div>,
    document.body,
  );
}
