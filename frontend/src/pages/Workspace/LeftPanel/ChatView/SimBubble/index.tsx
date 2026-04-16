import type { SimBubbleEvent, SimSummary } from '@/store/simulationStore';
import styles from './SimBubble.module.css';

const MEASURE_DISPLAY: Record<string, string> = {
  wifi_roaming_opt: 'WiFi漫游优化',
  wifi_channel_opt: 'WiFi信道切换',
  wifi_band_opt: 'WiFi频段调优',
  wifi_add_ap: 'AP补点',
  pon_expansion: 'PON扩容',
  upgrade_package: '套餐升级',
  pon_traffic_limit: 'PON流量限速',
  wifi_timeslot: 'WiFi时隙调度',
  pon_fiber_repair: 'PON光纤修复',
};

function fmt(v: number, unit: string): string {
  return `${v.toFixed(1)}${unit}`;
}

function delta(before: number, after: number, unit: string, lowerIsBetter = true) {
  const diff = after - before;
  const pct = Math.abs(diff).toFixed(1);
  const improved = lowerIsBetter ? diff < 0 : diff > 0;
  const sign = diff > 0 ? '+' : '';
  const arrow = improved ? '↓' : '↑';
  return (
    <span className={improved ? styles.improved : styles.worsened}>
      {arrow} {sign}{pct}{unit}
    </span>
  );
}

interface ComparisonProps {
  faultName: string;
  measures: string[];
  faultSummary: SimSummary;
  recoverySummary: SimSummary;
}

function ComparisonCard({ faultName, measures, faultSummary, recoverySummary }: ComparisonProps) {
  const displayMeasures = measures.map((m) => MEASURE_DISPLAY[m] ?? m).join('、');
  return (
    <div className={styles.comparisonBubble}>
      <div className={styles.comparisonCard}>
        <div className={styles.compTitle}>✅ 闭环措施已执行</div>
        <div className={styles.compMeasures}>
          故障：{faultName} &nbsp;|&nbsp; 措施：{displayMeasures || '（无）'}
        </div>
        <table className={styles.compTable}>
          <thead>
            <tr>
              <th>指标</th>
              <th>故障段</th>
              <th>恢复段</th>
              <th>改善</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>卡顿率</td>
              <td>{fmt(faultSummary.stallRate, '%')}</td>
              <td>{fmt(recoverySummary.stallRate, '%')}</td>
              <td>{delta(faultSummary.stallRate, recoverySummary.stallRate, '%', true)}</td>
            </tr>
            <tr>
              <td>平均吞吐</td>
              <td>{fmt(faultSummary.avgThroughput, ' Mbps')}</td>
              <td>{fmt(recoverySummary.avgThroughput, ' Mbps')}</td>
              <td>{delta(faultSummary.avgThroughput, recoverySummary.avgThroughput, ' Mbps', false)}</td>
            </tr>
            <tr>
              <td>TCP阻塞率</td>
              <td>{fmt(faultSummary.tcpBlockRatio, '%')}</td>
              <td>{fmt(recoverySummary.tcpBlockRatio, '%')}</td>
              <td>{delta(faultSummary.tcpBlockRatio, recoverySummary.tcpBlockRatio, '%', true)}</td>
            </tr>
            <tr>
              <td>带宽达标率</td>
              <td>{fmt(faultSummary.bandwidthMeetRate, '%')}</td>
              <td>{fmt(recoverySummary.bandwidthMeetRate, '%')}</td>
              <td>{delta(faultSummary.bandwidthMeetRate, recoverySummary.bandwidthMeetRate, '%', false)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface Props {
  event: SimBubbleEvent;
}

function SimBubble({ event }: Props) {
  if (event.kind === 'user') {
    return (
      <div className={styles.userBubble}>
        <div className={styles.userBubbleInner}>{event.text}</div>
      </div>
    );
  }
  if (event.kind === 'comparison') {
    return (
      <ComparisonCard
        faultName={event.faultName}
        measures={event.measures}
        faultSummary={event.faultSummary}
        recoverySummary={event.recoverySummary}
      />
    );
  }
  return (
    <div className={styles.systemBubble}>
      <div className={styles.systemBubbleInner}>{event.text}</div>
    </div>
  );
}

export default SimBubble;
