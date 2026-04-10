import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Workspace from './pages/Workspace';

function App() {
  useEffect(() => {
    document.title = '网络 Agent 操作台';
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Workspace />} />
        <Route path="*" element={<Workspace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
