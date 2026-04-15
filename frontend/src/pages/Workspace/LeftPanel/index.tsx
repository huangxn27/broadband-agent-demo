import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useConversationStore } from '@/store/conversationStore';
import ConversationList from './ConversationList';
import ChatView from './ChatView';
import styles from './LeftPanel.module.css';

interface Props {
  prefillMessage?: string;
  newConversation?: boolean;
}

function LeftPanel({ prefillMessage, newConversation }: Props) {
  const leftView = useWorkspaceStore((s) => s.leftView);
  const setLeftView = useWorkspaceStore((s) => s.setLeftView);
  const setActiveConversation = useWorkspaceStore((s) => s.setActiveConversation);
  const createConversation = useConversationStore((s) => s.create);
  const newConvHandled = useRef(false);

  // 从 Dashboard 跳转过来时，立即切到 chat 视图（避免闪列表），再异步建会话
  useEffect(() => {
    if (!prefillMessage) return;
    setLeftView('chat');
    (async () => {
      const conv = await createConversation('新对话');
      setActiveConversation(conv.id);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillMessage]);

  // 从导航栏「用户级问题查询入口」点击进入时，只切到 chat 视图；会话在首次发消息时懒创建
  useEffect(() => {
    if (!newConversation || newConvHandled.current) return;
    newConvHandled.current = true;
    setLeftView('chat');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newConversation]);

  return (
    <aside className={styles.leftPanel}>
      {leftView === 'list' ? <ConversationList /> : <ChatView prefillMessage={prefillMessage} lazySource="workspace" />}
    </aside>
  );
}

export default LeftPanel;
