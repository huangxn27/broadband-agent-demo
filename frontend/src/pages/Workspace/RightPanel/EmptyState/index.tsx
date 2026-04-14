import emptyImg from '@/assets/images/empty-topology.png';
import styles from './EmptyState.module.css';

function EmptyState() {
  return (
    <div className={styles.empty}>
      <div className={styles.imagePlaceholder}>
        <img src={emptyImg} alt="网络拓扑" className={styles.topoImg} />
      </div>
    </div>
  );
}

export default EmptyState;
