import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useConversationStore } from '@/store/conversationStore';
import MessageList from './MessageList';
import InputBubble from './InputBubble';
import styles from './ChatView.module.css';

function ChatView() {
  const backToList = useWorkspaceStore((s) => s.backToList);
  const activeId = useWorkspaceStore((s) => s.activeConversationId);
  const messages = useWorkspaceStore((s) => s.messages);
  const messagesLoading = useWorkspaceStore((s) => s.messagesLoading);
  const isStreaming = useWorkspaceStore((s) => s.isStreaming);
  const loadMessages = useWorkspaceStore((s) => s.loadMessages);
  const sendMessage = useWorkspaceStore((s) => s.sendMessage);

  const conversations = useConversationStore((s) => s.list);
  const [editDraft, setEditDraft] = useState('');

  const title = useMemo(() => {
    if (!activeId) return '对话';
    return conversations.find((c) => c.id === activeId)?.title ?? '新对话';
  }, [activeId, conversations]);

  useEffect(() => {
    if (activeId) {
      loadMessages(activeId);
    }
  }, [activeId, loadMessages]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={backToList}
          aria-label="返回会话列表"
        >
          <ArrowLeftOutlined />
        </button>
        <h2 className={styles.title} title={title}>
          {title}
        </h2>
      </header>

      <div className={styles.body}>
        <MessageList
          messages={messages}
          loading={messagesLoading}
          isStreaming={isStreaming}
          onEditMessage={(content) => setEditDraft(content)}
        />
      </div>

      <InputBubble
        disabled={isStreaming || !activeId}
        onSend={(content, deepThinking) => {
          setEditDraft('');
          sendMessage(content, deepThinking);
        }}
        fillValue={editDraft}
      />
    </div>
  );
}

export default ChatView;
