import { useState } from 'react';
import { CheckCircleFilled, DownOutlined, LoadingOutlined } from '@ant-design/icons';
import styles from './ThinkingBlock.module.css';

interface Props {
  content: string;
  durationSec?: number;
  streaming?: boolean;
}

function ThinkingBlock({ content, durationSec, streaming }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.block}>
      <button
        type="button"
        className={styles.head}
        onClick={() => setOpen((v) => !v)}
      >
        {streaming ? (
          <LoadingOutlined className={styles.iconLoading} spin />
        ) : (
          <CheckCircleFilled className={styles.iconDone} />
        )}
        <span>
          {streaming ? '正在深度思考...' : `已深度思考（${durationSec ?? 0}s）`}
        </span>
        <DownOutlined
          className={`${styles.arrow} ${open ? styles.arrowOpen : ''}`}
        />
      </button>
      {open && <div className={styles.body}>{content}</div>}
    </div>
  );
}

export default ThinkingBlock;
