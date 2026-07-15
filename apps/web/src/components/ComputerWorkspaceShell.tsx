import type { ReactNode } from 'react';
import { Button } from '@open-design/components';

import { Icon } from './Icon';
import styles from './ComputerWorkspaceShell.module.css';

interface Props {
  open: boolean;
  focused: boolean;
  title: string;
  detail?: string | null;
  expandLabel: string;
  restoreLabel: string;
  closeLabel: string;
  onToggleFocus: () => void;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The project workspace has one stable mental model: Computer is the large
 * right-hand surface, while files, previews, browser tabs, and replay are its
 * internal views. Keeping the shell mounted preserves live previews while the
 * user temporarily closes it to give the conversation the full window.
 */
export function ComputerWorkspaceShell({
  open,
  focused,
  title,
  detail,
  expandLabel,
  restoreLabel,
  closeLabel,
  onToggleFocus,
  onClose,
  children,
}: Props) {
  return (
    <section
      className={styles.shell}
      data-testid="computer-workspace-shell"
      data-focused={focused ? 'true' : 'false'}
      hidden={!open}
      aria-label={title}
    >
      <header className={styles.header}>
        <span className={styles.iconBadge} aria-hidden>
          <Icon name="present" size={16} />
        </span>
        <span className={styles.identity}>
          <strong>{title}</strong>
          {detail ? <span title={detail}>{detail}</span> : null}
        </span>
        <span className={styles.actions}>
          <Button
            variant="ghost"
            size="icon"
            className={styles.action}
            data-testid="computer-workspace-focus-toggle"
            aria-pressed={focused}
            aria-label={focused ? restoreLabel : expandLabel}
            title={focused ? restoreLabel : expandLabel}
            onClick={onToggleFocus}
          >
            <Icon name={focused ? 'minimize' : 'maximize'} size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={styles.action}
            data-testid="computer-workspace-close"
            aria-label={closeLabel}
            title={closeLabel}
            onClick={onClose}
          >
            <Icon name="close" size={16} />
          </Button>
        </span>
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
