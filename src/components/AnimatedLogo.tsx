import React, { useRef, useState } from "react";

interface AnimatedLogoProps {
  className?: string;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className = "" }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleMouseEnter = async () => {
    if (isPlaying) return; // Prevent overlapping sounds
    
    try {
      // Create a new audio instance each time to avoid conflicts
      const audio = new Audio('/robot-sound.mp3');
      audioRef.current = audio;
      
      // Set volume to a reasonable level
      audio.volume = 0.3;
      
      setIsPlaying(true);
      
      // Play the sound
      await audio.play();
      
      // Reset playing state when sound ends
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
    } catch (error) {
      console.log("Could not play robot sound:", error);
      setIsPlaying(false);
    }
  };

  return (
    <div 
      className={`robot-logo-container ${className}`}
      onMouseEnter={handleMouseEnter}
    >
      <img 
        src="/icon.png" 
        alt="Promptzy Robot Logo" 
        className="robot-logo w-18 h-18 sm:w-18 sm:h-18 cursor-pointer select-none"
        draggable={false}
      />
    </div>
  );
};

export default AnimatedLogo;
