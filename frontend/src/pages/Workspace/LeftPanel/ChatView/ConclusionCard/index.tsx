import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './ConclusionCard.module.css';

const COLLAPSED_LINES = 3;

interface Props {
  content: string;
  streaming?: boolean;
}

function ConclusionCard({ content, streaming }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasContent = !!content && content.trim().length > 0;

  const lines = useMemo(() => content.split('\n'), [content]);
  const needCollapse = lines.length > COLLAPSED_LINES + 1;
  const visibleContent = !expanded && needCollapse
    ? lines.slice(-COLLAPSED_LINES).join('\n')
    : content;

  if (!hasContent) return null;

  return (
    <div className={styles.card}>
      <div className={styles.contentBlock}>
        {needCollapse && !expanded && (
          <div className={styles.fadeTop} />
        )}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{visibleContent}</ReactMarkdown>
        {streaming && <span className={styles.cursor} />}
        {needCollapse && (
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? '收起 ↑' : `展开全文 ↓（共 ${lines.length} 行）`}
          </button>
        )}
      </div>
    </div>
  );
}

export default ConclusionCard;
