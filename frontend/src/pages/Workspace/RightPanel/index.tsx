import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWorkspaceStore } from '@/store/workspaceStore';
import EmptyState from './EmptyState';
import ImageDisplay from './ImageDisplay';
import InsightDisplay from './InsightDisplay';
import styles from './RightPanel.module.css';
import type { RenderBlock } from '@/types/render';

const MIN_RIGHT_WIDTH = 0.25; // 右槽最小宽度，低于此则另起一行

/** 根据数据量线性计算左图宽度（0~1） */
function computeWidth(block: RenderBlock): number {
  if (block.renderType === 'image') return 0.5;
  const chart = block.renderData.charts[0];
  if (!chart) return 0.5;
  const series = (chart.echartsOption.series ?? []) as { type?: string }[];
  if (series.some((s) => s.type === 'pie')) return 0.35;
  const xData = (chart.echartsOption.xAxis as { data?: unknown[] } | undefined)?.data;
  const count = Array.isArray(xData) ? xData.length : 0;
  if (count === 0) return 0.5;
  // clamp(40%, count * 1.5%, 75%)
  return Math.min(0.75, Math.max(0.40, count * 0.015));
}

type Row =
  | { kind: 'single'; block: RenderBlock; leftWidth: number; report?: string }
  | { kind: 'pair'; left: RenderBlock; right: RenderBlock; leftWidth: number; report?: string };

/** 贪心行分配：对全量 blocks 做一次纯函数计算 */
function computeRows(renders: RenderBlock[]): Row[] {
  const rows: Row[] = [];

  for (const block of renders) {
    const w = computeWidth(block);
    const report = block.renderType === 'insight' && block.renderData.markdownReport?.trim()
      ? block.renderData.markdownReport
      : undefined;
    const lastRow = rows[rows.length - 1];
    const remaining = lastRow?.kind === 'single' ? 1 - lastRow.leftWidth : 0;

    // 右槽有足够空间 → 填入右侧（右图自适应填满剩余）
    if (lastRow?.kind === 'single' && remaining >= MIN_RIGHT_WIDTH && !lastRow.report) {
      rows[rows.length - 1] = {
        kind: 'pair',
        left: lastRow.block,
        right: block,
        leftWidth: lastRow.leftWidth,
        report,
      };
    } else {
      rows.push({ kind: 'single', block, leftWidth: w, report });
    }
  }

  return rows;
}

function RightPanel() {
  const currentRenders = useWorkspaceStore((s) => s.currentRenders);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [currentRenders.length]);

  if (currentRenders.length === 0) {
    return (
      <main className={styles.rightPanel}>
        <EmptyState />
      </main>
    );
  }

  const rows = computeRows(currentRenders);

  return (
    <main className={styles.rightPanel}>
      {rows.map((row, i) => (
        <div key={i} className={styles.rowWrap}>
          <div className={styles.rowItems}>
            {row.kind === 'single' ? (
              <div style={{ width: `${row.leftWidth * 100}%` }}>
                {row.block.renderType === 'image'
                  ? <ImageDisplay data={row.block.renderData} />
                  : <InsightDisplay data={row.block.renderData} />}
              </div>
            ) : (
              <>
                <div style={{ width: `${row.leftWidth * 100}%`, flexShrink: 0 }}>
                  {row.left.renderType === 'image'
                    ? <ImageDisplay data={row.left.renderData} />
                    : <InsightDisplay data={row.left.renderData} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {row.right.renderType === 'image'
                    ? <ImageDisplay data={row.right.renderData} />
                    : <InsightDisplay data={row.right.renderData} />}
                </div>
              </>
            )}
          </div>

          {row.report && (
            <div className={styles.reportRow}>
              <div className={styles.reportInner}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{row.report}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </main>
  );
}

export default RightPanel;
