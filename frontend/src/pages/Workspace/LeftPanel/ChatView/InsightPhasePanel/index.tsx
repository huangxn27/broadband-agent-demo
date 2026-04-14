import { useState, useEffect } from 'react';
import { Tooltip } from 'antd';
import { CheckCircleFilled, SyncOutlined, RightOutlined } from '@ant-design/icons';

import type { InsightState, InsightPhase, InsightStep, PhaseStatus } from '@/types/insight';
import type { ChartItem } from '@/types/render';
import styles from './InsightPhasePanel.module.css';

interface Props {
  state: InsightState;
  /** 面板模式：传入时渲染为可折叠的固定高度面板 */
  collapsed?: boolean;
  onToggle?: () => void;
  /** 报告就绪时在底部左侧渲染查看按钮 */
  reportContent?: string;
  reportCharts?: ChartItem[];
  onViewReport?: (content: string, charts: ChartItem[]) => void;
}

function PhaseIcon({ status }: { status: PhaseStatus }) {
  if (status === 'done') return <CheckCircleFilled className={styles.iconDone} />;
  if (status === 'running') return <span className={styles.spinRing} />;
  if (status === 'reflected') return <SyncOutlined className={styles.iconReflected} />;
  return <span className={styles.iconPending}>○</span>;
}

function StepRow({ step }: { step: InsightStep }) {
  const label = step.rationale || step.insightTypes.join(' · ') || `Step ${step.stepId}`;
  return (
    <div className={`${styles.stepBlock} ${styles[`step_${step.status}`]}`}>
      <div className={styles.stepRow}>
        {step.status === 'done'
          ? <CheckCircleFilled className={styles.stepIconDone} />
          : step.status === 'running'
            ? <span className={styles.spinRingSmall} />
            : <span className={styles.stepDot} />
        }
        <span className={styles.stepLabel}>{label}</span>
        {step.significance !== undefined && step.status === 'done' && (
          <span className={styles.stepSig}>显著性 {step.significance.toFixed(2)}</span>
        )}
      </div>
      {step.summary && step.status === 'done' && (
        <div className={styles.stepSummary}>{step.summary}</div>
      )}
    </div>
  );
}

function PhaseRow({ phase }: { phase: InsightPhase }) {
  const isDiscarded = phase.reflection?.choice === 'D';
  const isDone = phase.status === 'done' || phase.status === 'reflected';
  const hasSteps = phase.steps.length > 0;
  const [expanded, setExpanded] = useState(!isDone);

  useEffect(() => {
    if (isDone) setExpanded(false);
  }, [isDone]);

  const toggleable = hasSteps && isDone;

  return (
    <div className={`${styles.phaseBlock} ${isDiscarded ? styles.phaseDiscarded : ''}`}>
      <div
        className={`${styles.phaseHeader} ${toggleable ? styles.phaseHeaderClickable : ''}`}
        onClick={toggleable ? () => setExpanded((v) => !v) : undefined}
      >
        <PhaseIcon status={phase.status} />
        <span className={`
          ${styles.phaseName}
          ${phase.status === 'running' ? styles.phaseNameActive : ''}
          ${isDiscarded ? styles.phaseNameDiscarded : ''}
        `.trim()}>
          {phase.name}
        </span>
        {phase.reflection && (
          <Tooltip title={phase.reflection.reason} placement="right" overlayStyle={{ maxWidth: 280 }}>
            <span className={`${styles.reflectBadge} ${isDiscarded ? styles.reflectBadgeDiscarded : ''}`}>
              {isDiscarded ? '已删除 (D)' : `已调整 (${phase.reflection.choice})`}
            </span>
          </Tooltip>
        )}
        {toggleable && (
          <RightOutlined className={`${styles.phaseArrow} ${expanded ? styles.phaseArrowOpen : ''}`} />
        )}
      </div>
      {hasSteps && expanded && (
        <div className={styles.stepList}>
          {phase.steps.map((s) => (
            <StepRow key={s.stepId} step={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function InsightPhasePanel({ state, collapsed, onToggle, reportContent, reportCharts, onViewReport }: Props) {
  const done = state.phases.filter((p) => p.status === 'done' || p.status === 'reflected').length;
  const total = state.totalPhases || state.phases.length;
  const isPanelMode = onToggle !== undefined;

  const panelClass = [
    styles.panel,
    isPanelMode ? styles.panelFixed : '',
    isPanelMode && collapsed ? styles.panelCollapsed : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={panelClass}>
      <div
        className={`${styles.panelHeader} ${isPanelMode ? styles.panelHeaderClickable : ''}`}
        onClick={isPanelMode ? onToggle : undefined}
      >
        <span className={styles.panelTitle}>进度跟踪</span>
        {state.goal && !isPanelMode && (
          <span className={styles.goalInline}>{state.goal}</span>
        )}
        <span className={styles.panelProgress}>{done} / {total}</span>
        {isPanelMode && (
          <span className={`${styles.collapseChevron} ${collapsed ? styles.chevronCollapsed : styles.chevronExpanded}`} />
        )}
      </div>

      {(!isPanelMode || !collapsed) && (
        <>
          {state.goal && isPanelMode && (
            <div className={styles.goal}>{state.goal}</div>
          )}
          <div className={styles.phaseList}>
            {state.phases.map((p) => (
              <PhaseRow key={p.phaseId} phase={p} />
            ))}
          </div>
          {onViewReport && reportContent !== undefined && reportCharts !== undefined && (
            <div className={styles.reportFooter}>
              <button
                className={styles.reportBtn}
                type="button"
                onClick={() => onViewReport(reportContent, reportCharts)}
              >
                <span className={styles.reportIcon}>📄</span>
                <span className={styles.reportText}>点击查看报告</span>
                <span className={styles.reportArrow}>→</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default InsightPhasePanel;
