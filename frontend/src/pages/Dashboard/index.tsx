import { useState } from 'react';
import TopBar from '@/components/Layout/TopBar';
import Sidebar from '@/components/Layout/Sidebar';
import DashboardLeftPanel from './LeftPanel';
import RightArea from './RightArea';
import styles from './Dashboard.module.css';

function Dashboard() {
  const [rightView, setRightView] = useState<'map' | 'report'>('map');
  const [reportContent, setReportContent] = useState('');

  const handleViewReport = (content: string) => {
    setReportContent(content);
    setRightView('report');
  };

  return (
    <div className={styles.page}>
      <TopBar />
      <div className={styles.body}>
        <Sidebar />
        <DashboardLeftPanel onViewReport={handleViewReport} />
        <RightArea
          view={rightView}
          reportContent={reportContent}
          onBack={() => setRightView('map')}
        />
      </div>
    </div>
  );
}

export default Dashboard;
