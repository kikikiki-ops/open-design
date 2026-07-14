import { useEffect, useState } from 'react';
import { Icon } from './Icon';

type WorkspaceSettingsViewProps = {
  hasActiveSubscription?: boolean;
};

export function WorkspaceSettingsView({ hasActiveSubscription = false }: WorkspaceSettingsViewProps) {
  const [workspaceName, setWorkspaceName] = useState('Nexu 团队');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [subscriptionActive, setSubscriptionActive] = useState(hasActiveSubscription);
  const canDelete = deleteText.trim() === workspaceName.trim();

  useEffect(() => {
    setSubscriptionActive(hasActiveSubscription);
  }, [hasActiveSubscription]);

  function handleDelete() {
    if (subscriptionActive) return;
    if (!canDelete) return;
    setConfirmingDelete(false);
    setDeleteText('');
    setToast('Demo：Workspace 删除流程已触发');
    window.setTimeout(() => setToast(null), 2600);
  }

  return (
    <div className="entry-section workspace-settings">
      <header className="entry-section__head workspace-settings__head">
        <div>
          <h1 className="entry-section__title">Workspace 设置</h1>
        </div>
      </header>

      {toast ? <div className="workspace-settings__toast">{toast}</div> : null}

      <section className="workspace-settings__panel" aria-label="Workspace 基础信息">
        <div className="workspace-settings__row">
          <div className="workspace-settings__label">
            <strong>Workspace 名称</strong>
            <span>显示在侧边栏、邀请页和团队项目空间中。</span>
          </div>
          <input
            className="workspace-settings__input"
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            aria-label="Workspace 名称"
          />
        </div>

        <div className="workspace-settings__row">
          <div className="workspace-settings__label">
            <strong>Workspace 图标</strong>
            <span>用于团队切换、邀请页和协作成员识别。</span>
          </div>
          <div className="workspace-settings__icon-editor">
            <span className="workspace-settings__icon-preview" aria-hidden>
              N
            </span>
            <button type="button" className="workspace-settings__secondary-btn">
              更换图标
            </button>
          </div>
        </div>
      </section>

      <section className="workspace-settings__danger" aria-label="危险操作区">
        <div className="workspace-settings__danger-copy">
          <span className="workspace-settings__danger-icon" aria-hidden>
            <Icon name="alert-triangle" size={18} />
          </span>
          <div>
            <h2>危险操作区</h2>
            <p>删除 Workspace 后，团队项目、成员关系和设置将无法恢复。</p>
          </div>
        </div>
        <button
          type="button"
          className="workspace-settings__danger-btn"
          onClick={() => setConfirmingDelete(true)}
        >
          删除 Workspace
        </button>
      </section>

      {confirmingDelete ? (
        <div className="workspace-settings__modal-backdrop" role="presentation">
          <section
            className={`workspace-settings__modal${subscriptionActive ? ' workspace-settings__modal--subscription' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="删除 Workspace"
          >
            <header>
              <h2>删除 Workspace？</h2>
              <button
                type="button"
                className="workspace-settings__modal-close"
                onClick={() => {
                  setConfirmingDelete(false);
                  setDeleteText('');
                }}
                aria-label="关闭"
              >
                <Icon name="close" size={14} />
              </button>
            </header>
            {subscriptionActive ? (
              <>
                <div className="workspace-settings__subscription-block">
                  <span className="workspace-settings__danger-icon" aria-hidden>
                    <Icon name="alert-triangle" size={18} />
                  </span>
                  <div>
                    <strong>当前 Workspace 仍处于订阅状态</strong>
                    <p>删除前需要先取消团队版订阅，避免席位费用和结算周期继续生效。</p>
                  </div>
                </div>
                <div className="workspace-settings__modal-actions">
                  <button
                    type="button"
                    className="workspace-settings__secondary-btn"
                    onClick={() => {
                      setConfirmingDelete(false);
                      setDeleteText('');
                    }}
                  >
                    暂不删除
                  </button>
                  <button
                    type="button"
                    className="workspace-settings__danger-btn"
                    onClick={() => {
                      setSubscriptionActive(false);
                      setToast('Demo：订阅已取消，现在可以继续删除 Workspace');
                      window.setTimeout(() => setToast(null), 2600);
                    }}
                  >
                    先取消订阅
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>请输入 <strong>{workspaceName}</strong> 以确认删除。这个操作在真实产品中不可恢复。</p>
                <input
                  className="workspace-settings__input"
                  value={deleteText}
                  onChange={(event) => setDeleteText(event.target.value)}
                  placeholder={workspaceName}
                  aria-label="确认 Workspace 名称"
                  autoFocus
                />
                <div className="workspace-settings__modal-actions">
                  <button
                    type="button"
                    className="workspace-settings__secondary-btn"
                    onClick={() => {
                      setConfirmingDelete(false);
                      setDeleteText('');
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="workspace-settings__danger-btn"
                    disabled={!canDelete}
                    onClick={handleDelete}
                  >
                    确认删除
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
