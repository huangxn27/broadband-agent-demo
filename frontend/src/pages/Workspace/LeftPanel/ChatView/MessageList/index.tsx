import { useEffect, useRef } from 'react';
import { Empty, Skeleton } from 'antd';
import type { Message } from '@/types/message';
import UserBubble from '../UserBubble';
import StepCard from '../StepCard';
import ConclusionCard from '../ConclusionCard';
import ErrorCard from '../ErrorCard';
import styles from './MessageList.module.css';

interface Props {
  messages: Message[];
  loading: boolean;
  isStreaming: boolean;
  onEditMessage: (content: string) => void;
}

function MessageList({ messages, loading, isStreaming, onEditMessage }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚到底部
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isStreaming]);

  if (loading) {
    return (
      <div className={styles.scroll}>
        <div className={styles.loading}>
          <Skeleton active paragraph={{ rows: 2 }} />
          <Skeleton active paragraph={{ rows: 3 }} />
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={styles.scroll}>
        <div className={styles.empty}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: '#6b7280' }}>开始你的第一句提问</span>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.scroll} ref={scrollRef}>
      <div className={styles.list}>
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <UserBubble
                key={msg.id}
                content={msg.content}
                onEdit={isStreaming ? undefined : onEditMessage}
              />
            );
          }
          return (
            <div key={msg.id} className={styles.assistantGroup}>
              {msg.steps?.map((step) => (
                <StepCard key={step.stepId} step={step} />
              ))}
              {msg.error ? (
                <ErrorCard message={msg.error} />
              ) : (
                <ConclusionCard
                  thinkingContent={msg.thinkingContent}
                  thinkingDurationSec={msg.thinkingDurationSec}
                  content={msg.content}
                  streaming={msg.streaming}
                />
              )}
            </div>
          );
        })}
        {/* 流式占位（输入框已禁用，但留个底部空间） */}
        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}

export default MessageList;
