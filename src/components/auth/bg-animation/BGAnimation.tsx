'use client';
import { useEffect, useRef } from 'react';
import styles from './animations.module.css';

interface Star {
  x: number;
  y: number;
  z: number;
  o: number;
  size: number;
}

const BGAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const context = canvas.getContext('2d');
    if (!context) return;

    const numStars = 1000;
    const stars: Star[] = [];
    let speed = 10;

    const mouseX = canvas.width / 4;
    const mouseY = canvas.height / 5;

    function createStar(): Star {
      let x, y;
      do {
        x = Math.random() * canvas!.width;
        y = Math.random() * canvas!.height;
      } while (Math.hypot(x - mouseX, y - mouseY) < 3);

      return {
        x,
        y,
        z: Math.random() * canvas!.width,
        o: Math.random(),
        size: Math.random() * 3 + 2,
      };
    }

    function populateStars(): void {
      stars.length = 0;
      for (let i = 0; i < numStars; i++) {
        stars.push(createStar());
      }
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.code === 'ArrowUp' || event.code === 'KeyW') {
        speed += 1;
      } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        speed = Math.max(1, speed - 1);
      }
    };

    function updateStars(): void {
      context!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const star of stars) {
        star.z -= speed;

        if (star.z <= 0) {
          Object.assign(star, createStar());
          star.z = canvas!.width;
        }

        const sx = (star.x - mouseX) * (canvas!.width / star.z) + mouseX;
        const sy = (star.y - mouseY) * (canvas!.width / star.z) + mouseY;
        const size = (1 - star.z / canvas!.width) * star.size;
        context!.fillStyle = 'white';
        context!.fillRect(sx, sy, size, size);
      }

      requestAnimationFrame(updateStars);
    }

    populateStars();
    updateStars();
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className={styles.space}>
      <canvas ref={canvasRef} id='2dcanvas'></canvas>
    </div>
  );
};

export default BGAnimation;