import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  speedX: number;
  speedY: number;
}

interface CelebrationConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

export const CelebrationConfetti: React.FC<CelebrationConfettiProps> = ({ active, onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const colors = ['#6D28D9', '#7C3AED', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#EDE9FE'];
    const count = 75;
    const initialParticles: Particle[] = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 6,
      rotation: Math.random() * 360,
      speedX: (Math.random() - 0.5) * 6,
      speedY: Math.random() * 5 + 3,
    }));

    setParticles(initialParticles);

    const animation = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.speedX,
            y: p.y + p.speedY,
            rotation: p.rotation + 4,
          }))
          .filter((p) => p.y < window.innerHeight)
      );
    }, 25);

    const timeout = setTimeout(() => {
      clearInterval(animation);
      setParticles([]);
      if (onComplete) onComplete();
    }, 3500);

    return () => {
      clearInterval(animation);
      clearTimeout(timeout);
    };
  }, [active, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size * 1.5}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            borderRadius: '2px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          }}
        />
      ))}
    </div>
  );
};
