import { useWorkspaceStore } from '@/store/workspaceStore';
import EmptyState from './EmptyState';
import ImageDisplay from './ImageDisplay';
import InsightDisplay from './InsightDisplay';
import styles from './RightPanel.module.css';

function RightPanel() {
  const currentRenders = useWorkspaceStore((s) => s.currentRenders);

  if (currentRenders.length === 0) {
    return (
      <main className={styles.rightPanel}>
        <EmptyState />
      </main>
    );
  }

  return (
    <main className={styles.rightPanel}>
      {currentRenders.map((block, i) =>
        block.renderType === 'image' ? (
          <ImageDisplay key={i} data={block.renderData} />
        ) : (
          <InsightDisplay key={i} data={block.renderData} />
        )
      )}
    </main>
  );
}

export default RightPanel;
