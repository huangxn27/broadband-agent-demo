import { useRef, useCallback } from 'react';
import NavBar from './NavBar';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import styles from './Workspace.module.css';

const MIN_LEFT = 320;
const MAX_LEFT = 720;
const DEFAULT_LEFT = 484;

function Workspace() {
  const leftWidth = useRef(DEFAULT_LEFT);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth.current;

    const onMouseMove = (ev: MouseEvent) => {
      const next = Math.min(MAX_LEFT, Math.max(MIN_LEFT, startWidth + ev.clientX - startX));
      leftWidth.current = next;
      if (leftRef.current) leftRef.current.style.width = `${next}px`;
      // 拖动中光标锁定
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  return (
    <div className={styles.workspace} ref={containerRef}>
      <NavBar />
      <div ref={leftRef} className={styles.leftWrap} style={{ width: DEFAULT_LEFT }}>
        <LeftPanel />
      </div>
      <div
        ref={dividerRef}
        className={styles.divider}
        onMouseDown={onMouseDown}
      />
      <RightPanel />
    </div>
  );
}

export default Workspace;
