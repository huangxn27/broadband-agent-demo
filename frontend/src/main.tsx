import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'antd/dist/reset.css';
import './index.css';
import App from './App';

async function bootstrap() {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#1677FF',
            colorBgLayout: '#0D1117',
            colorBgContainer: '#161B22',
            colorBgElevated: '#161B22',
            borderRadius: 8,
          },
        }}
      >
        <AntdApp>
          <App />
        </AntdApp>
      </ConfigProvider>
    </React.StrictMode>,
  );
}

bootstrap();
