import { useWorkspaceStore } from '@/store/workspaceStore';
import EmptyState from './EmptyState';
import ImageDisplay from './ImageDisplay';
import InsightDisplay from './InsightDisplay';
import styles from './RightPanel.module.css';

function RightPanel() {
  const currentRender = useWorkspaceStore((s) => s.currentRender);

  return (
    <main className={styles.rightPanel}>
      {!currentRender ? (
        <EmptyState />
      ) : currentRender.renderType === 'image' ? (
        <ImageDisplay data={currentRender.renderData} />
      ) : (
        <InsightDisplay data={currentRender.renderData} />
      )}
    </main>
  );
}

export default RightPanel;
