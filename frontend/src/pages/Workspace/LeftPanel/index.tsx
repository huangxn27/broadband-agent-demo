import { useWorkspaceStore } from '@/store/workspaceStore';
import ConversationList from './ConversationList';
import ChatView from './ChatView';
import styles from './LeftPanel.module.css';

function LeftPanel() {
  const leftView = useWorkspaceStore((s) => s.leftView);

  return (
    <aside className={styles.leftPanel}>
      {leftView === 'list' ? <ConversationList /> : <ChatView />}
    </aside>
  );
}

export default LeftPanel;
