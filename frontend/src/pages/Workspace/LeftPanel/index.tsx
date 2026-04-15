import { useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import ConversationList from './ConversationList';
import ChatView from './ChatView';
import styles from './LeftPanel.module.css';

interface Props {
  prefillMessage?: string;
}

function LeftPanel({ prefillMessage }: Props) {
  const leftView = useWorkspaceStore((s) => s.leftView);
  const startNewConversation = useWorkspaceStore((s) => s.startNewConversation);

  // 从 Dashboard 跳转过来时，切到空白 chat 视图；会话在首次发消息时懒创建
  useEffect(() => {
    if (!prefillMessage) return;
    startNewConversation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillMessage]);

  return (
    <aside className={styles.leftPanel}>
      {leftView === 'list' ? <ConversationList /> : <ChatView prefillMessage={prefillMessage} lazySource="workspace" />}
    </aside>
  );
}

export default LeftPanel;
