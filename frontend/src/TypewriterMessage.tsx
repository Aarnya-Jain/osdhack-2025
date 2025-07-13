import React, { useState, useEffect } from 'react';

type TypewriterMessageProps = {
  message: string;
  speed?: number;
  audio: HTMLAudioElement | null; // It now receives the audio player as a prop
};

const TypewriterMessage: React.FC<TypewriterMessageProps> = ({ message, speed = 40, audio }) => {
  const [displayedMessage, setDisplayedMessage] = useState('');

  // This component NO LONGER creates its own audio object.

  useEffect(() => {
    if (!message || message.startsWith('>')) {
      setDisplayedMessage(message);
      return;
    }

    setDisplayedMessage(''); 
    let index = 0;
    const intervalId = setInterval(() => {
      if (index >= message.length) {
        clearInterval(intervalId);
        return;
      }
      
      setDisplayedMessage(prev => prev + message[index]);

      // Use the audio object passed in from App.tsx
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(error => {});
      }
      index++;
    }, speed);

    return () => clearInterval(intervalId);
  }, [message, speed, audio]); // Add 'audio' to the dependency array

  const isTyping = displayedMessage.length < message.length;

  return (
    <div className="console-line">
      {displayedMessage}
      {isTyping && !message.startsWith('>') && <span className="blinking-cursor">|</span>}
    </div>
  );
};

export default TypewriterMessage;