import { Image } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ImageRenderData } from '@/types/render';
import styles from './ImageDisplay.module.css';

interface Props {
  data: ImageRenderData;
}

function ImageDisplay({ data }: Props) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{data.title}</h1>
      <div className={styles.imageBox}>
        <Image
          src={data.imageUrl}
          alt={data.title}
          className={styles.image}
          loading="lazy"
          preview={{ mask: '点击查看大图' }}
          fallback="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCBmaWxsPSIjMTYxQjIyIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj7lm77niYflip/lhYU8L3RleHQ+PC9zdmc+"
        />
      </div>
      <div className={styles.conclusion}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.conclusion}</ReactMarkdown>
      </div>
    </div>
  );
}

export default ImageDisplay;
