import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

type TypewriterMessageProps = {
  message: string;
  speed?: number;
};

const TypewriterMessage: React.FC<TypewriterMessageProps> = ({ message, speed = 30 }) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  
  const typeSound = useMemo(() => new Audio('/click.mp3'), []); 
  typeSound.volume = 0.5; // Adjust volume as needed

  useEffect(() => {
    if (message.startsWith('>') || message.length < 3) {
      setDisplayedMessage(message);
      return;
    }

    setDisplayedMessage(''); 
    let index = 0;

    const intervalId = setInterval(() => {
    
      setDisplayedMessage(prev => prev + message[index]);

      // Play sound
      typeSound.currentTime = 0; 
      typeSound.play();

      index++;
      if (index === message.length) {
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [message, speed, typeSound]);

  return (
    <div className="console-line">
      {displayedMessage}
      <span className="blinking-cursor">|</span>
    </div>
  );
};

export default TypewriterMessage;