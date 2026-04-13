import { useWorkspaceStore } from '@/store/workspaceStore';
import EmptyState from './EmptyState';
import ImageDisplay from './ImageDisplay';
import InsightDisplay from './InsightDisplay';
import styles from './RightPanel.module.css';
import type { RenderBlock } from '@/types/render';

type Segment =
  | { kind: 'images'; blocks: RenderBlock[] }
  | { kind: 'insight'; block: RenderBlock };

function groupRenders(renders: RenderBlock[]): Segment[] {
  const segments: Segment[] = [];
  for (const block of renders) {
    if (block.renderType === 'image') {
      const last = segments[segments.length - 1];
      if (last?.kind === 'images') {
        last.blocks.push(block);
      } else {
        segments.push({ kind: 'images', blocks: [block] });
      }
    } else {
      segments.push({ kind: 'insight', block });
    }
  }
  return segments;
}

function RightPanel() {
  const currentRenders = useWorkspaceStore((s) => s.currentRenders);

  if (currentRenders.length === 0) {
    return (
      <main className={styles.rightPanel}>
        <EmptyState />
      </main>
    );
  }

  const segments = groupRenders(currentRenders);

  return (
    <main className={styles.rightPanel}>
      {segments.map((seg, i) =>
        seg.kind === 'images' ? (
          <div key={i} className={styles.imageGrid}>
            {seg.blocks.map((block, j) => (
              <ImageDisplay key={j} data={block.renderData} />
            ))}
          </div>
        ) : (
          <InsightDisplay key={i} data={seg.block.renderData} />
        )
      )}
    </main>
  );
}

export default RightPanel;
