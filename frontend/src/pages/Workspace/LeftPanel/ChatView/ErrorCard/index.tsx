import { CloseCircleFilled } from '@ant-design/icons';
import styles from './ErrorCard.module.css';

interface Props {
  message: string;
}

function ErrorCard({ message }: Props) {
  return (
    <div className={styles.card}>
      <CloseCircleFilled className={styles.icon} />
      <div className={styles.content}>
        <div className={styles.title}>执行失败</div>
        <div className={styles.msg}>{message}</div>
      </div>
    </div>
  );
}

export default ErrorCard;
