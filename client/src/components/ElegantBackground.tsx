import { useEffect, useState } from 'react';

interface Bubble {
  id: number;
  size: number;
  left: string;
  top: string;
  delay: number;
  duration: number;
}

export default function ElegantBackground() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  
  useEffect(() => {
    // Create random bubbles
    const newBubbles: Bubble[] = [];
    const bubbleCount = 8; // Number of bubbles to create
    
    for (let i = 0; i < bubbleCount; i++) {
      newBubbles.push({
        id: i,
        size: Math.floor(Math.random() * 60) + 40, // Random size between 40px and 100px
        left: `${Math.floor(Math.random() * 90)}%`, // Random horizontal position
        top: `${Math.floor(Math.random() * 90)}%`, // Random vertical position
        delay: Math.floor(Math.random() * 10), // Random delay between 0-10s
        duration: Math.floor(Math.random() * 10) + 15, // Random duration between 15-25s
      });
    }
    
    setBubbles(newBubbles);
  }, []);
  
  return (
    <div className="elegant-background">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="elegant-bubble"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: bubble.left,
            top: bubble.top,
            animationDelay: `${bubble.delay}s`,
            animationDuration: `${bubble.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
