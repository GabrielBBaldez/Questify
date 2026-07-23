import { useMemo } from 'react';
import styles from './Confetti.module.css';

const COLORS = ['#6366f1', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa', '#f472b6', '#fb923c'];
const SHAPES = ['square', 'circle'] as const;
const PIECE_COUNT = 60;

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  shape: typeof SHAPES[number];
}

function generatePieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 10,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
  }));
}

export function Confetti() {
  const pieces = useMemo(() => generatePieces(), []);

  return (
    <div className={styles.container}>
      {pieces.map((p) => (
        <div
          key={p.id}
          className={styles.piece}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}
