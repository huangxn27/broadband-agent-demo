import { CloudServerOutlined } from '@ant-design/icons';
import styles from './EmptyState.module.css';

function EmptyState() {
  return (
    <div className={styles.empty}>
      <CloudServerOutlined className={styles.icon} />
      <p className={styles.text}>等待 Agent 输出结果...</p>
      <p className={styles.hint}>在左侧发起对话，结果将在此呈现</p>
    </div>
  );
}

export default EmptyState;
