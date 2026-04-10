import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircleFilled, DownOutlined, LoadingOutlined } from '@ant-design/icons';
import styles from './ConclusionCard.module.css';

interface Props {
  thinkingContent?: string;
  thinkingDurationSec?: number;
  content: string;
  streaming?: boolean;
}

function ConclusionCard({ thinkingContent, thinkingDurationSec, content, streaming }: Props) {
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const hasThinking = !!thinkingContent && thinkingContent.trim().length > 0;

  return (
    <div className={styles.card}>
      {hasThinking && (
        <div className={styles.thinkingBlock}>
          <button
            type="button"
            className={styles.thinkingHead}
            onClick={() => setThinkingOpen((v) => !v)}
          >
            {streaming ? (
              <LoadingOutlined className={styles.thinkingIcon} spin />
            ) : (
              <CheckCircleFilled className={styles.thinkingIconDone} />
            )}
            <span>
              {streaming ? '正在深度思考...' : `已深度思考（${thinkingDurationSec ?? 0}s）`}
            </span>
            <DownOutlined
              className={`${styles.thinkingArrow} ${thinkingOpen ? styles.thinkingArrowOpen : ''}`}
            />
          </button>
          {thinkingOpen && <div className={styles.thinkingBody}>{thinkingContent}</div>}
        </div>
      )}

      {content && (
        <div className={styles.contentBlock}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          {streaming && <span className={styles.cursor} />}
        </div>
      )}
    </div>
  );
}

export default ConclusionCard;
