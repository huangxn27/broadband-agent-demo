import { useState } from 'react';
import { CheckCircleFilled, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Step } from '@/types/message';
import styles from './StepCard.module.css';

interface Props {
  step: Step;
  defaultExpanded?: boolean;
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StepCard({ step, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`${styles.card} ${expanded ? styles.expanded : ''}`}>
      <button
        type="button"
        className={styles.head}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <CheckCircleFilled className={styles.statusIcon} />
        <span className={styles.title}>{step.title}</span>
        <span className={styles.count}>{step.subSteps.length} 步</span>
        <RightOutlined className={`${styles.arrow} ${expanded ? styles.arrowOpen : ''}`} />
      </button>

      {expanded && (
        <div className={styles.body}>
          {step.subSteps.length === 0 ? (
            <div className={styles.placeholder}>暂无子步骤</div>
          ) : (
            <ul className={styles.timeline}>
              {step.subSteps.map((sub, i) => (
                <li key={sub.subStepId} className={styles.tlItem}>
                  <span
                    className={`${styles.dot} ${i === step.subSteps.length - 1 ? styles.dotLast : ''}`}
                  />
                  <div className={styles.tlContent}>
                    <div className={styles.tlHeader}>
                      <span className={styles.tlName}>{sub.name}</span>
                      <span className={styles.tlTime}>
                        {dayjs(sub.completedAt).format('HH:mm:ss')} · {formatDuration(sub.durationMs)}
                      </span>
                    </div>
                    <div className={styles.tlResult}>{sub.result}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default StepCard;
