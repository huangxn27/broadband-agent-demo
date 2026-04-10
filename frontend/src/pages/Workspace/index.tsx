import NavBar from './NavBar';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import styles from './Workspace.module.css';

function Workspace() {
  return (
    <div className={styles.workspace}>
      <NavBar />
      <LeftPanel />
      <RightPanel />
    </div>
  );
}

export default Workspace;
