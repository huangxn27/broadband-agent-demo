import { Tooltip } from 'antd';
import { UnorderedListOutlined, SettingOutlined, ApiFilled } from '@ant-design/icons';
import { useWorkspaceStore } from '@/store/workspaceStore';
import styles from './NavBar.module.css';

function NavBar() {
  const leftView = useWorkspaceStore((s) => s.leftView);
  const backToList = useWorkspaceStore((s) => s.backToList);

  return (
    <nav className={styles.navBar}>
      <div className={styles.logo} title="网络 Agent 操作台">
        <ApiFilled />
      </div>

      <div className={styles.iconGroup}>
        <Tooltip title="会话列表" placement="right">
          <button
            type="button"
            className={`${styles.iconBtn} ${leftView === 'list' ? styles.active : ''}`}
            onClick={backToList}
            aria-label="会话列表"
          >
            <UnorderedListOutlined />
          </button>
        </Tooltip>
      </div>

      <div className={styles.bottomGroup}>
        <Tooltip title="设置" placement="right">
          <button type="button" className={styles.iconBtn} aria-label="设置">
            <SettingOutlined />
          </button>
        </Tooltip>
      </div>
    </nav>
  );
}

export default NavBar;
