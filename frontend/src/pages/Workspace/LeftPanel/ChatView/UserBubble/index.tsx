import { EditOutlined } from '@ant-design/icons';
import styles from './UserBubble.module.css';

interface Props {
  content: string;
  onEdit?: (content: string) => void;
}

function UserBubble({ content, onEdit }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.group}>
        {onEdit && (
          <button
            type="button"
            className={styles.editBtn}
            onClick={() => onEdit(content)}
            title="编辑并重新发送"
          >
            <EditOutlined />
          </button>
        )}
        <div className={styles.bubble}>{content}</div>
      </div>
    </div>
  );
}

export default UserBubble;
