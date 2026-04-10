import styles from './UserBubble.module.css';

interface Props {
  content: string;
}

function UserBubble({ content }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.bubble}>{content}</div>
    </div>
  );
}

export default UserBubble;
