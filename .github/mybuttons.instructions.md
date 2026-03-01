import React, { useRef, useState } from 'react';
import { Sparkles, Zap, Heart, Bot } from 'lucide-react';

export default function App() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 font-sans selection:bg-rose-500/30">
            {/* Header Section */}
            <div className="text-center mb-16 flex flex-col items-center">
                <div className="p-4 bg-zinc-900 rounded-full mb-6 border border-zinc-800 shadow-[0_0_30px_-5px_rgba(34,211,238,0.15)]">
                    <Bot size={48} className="text-cyan-400" />
                </div>
                <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-yellow-400 to-rose-400">
                    Sparkle Bots UI
                </h1>
                <p className="text-zinc-400 text-lg max-w-md mx-auto">
                    Modern, reactive components engineered for maximum badassery. Hover around to see the magic.
                </p>
            </div>

            {/* The Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                <ShinyButton 
                    label="Cyan Core" 
                    hex="#22d3ee" 
                    icon={Sparkles} 
                />
                <ShinyButton 
                    label="Yellow Spark" 
                    hex="#fbbf24" 
                    icon={Zap} 
                />
                <ShinyButton 
                    label="Rose Petal" 
                    hex="#f43f8e" 
                    icon={Heart} 
                />
            </div>

            {/* Global background style reset just in case */}
            <style>{`
                body {
                    background-color: #09090b; /* zinc-950 */
                    margin: 0;
                    padding: 0;
                }
            `}</style>
        </div>
    );
}

function ShinyButton({ label, hex, icon: Icon }) {
    const buttonRef = useRef(null);
    const [mouseX, setMouseX] = useState(0.5);
    const [mouseY, setMouseY] = useState(0.5);
    const [isHovered, setIsHovered] = useState(false);

    const mouseMove = (e) => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        // Calculate mouse position relative to the button (0 to 1)
        setMouseX((e.clientX - rect.left) / rect.width);
        setMouseY((e.clientY - rect.top) / rect.height);
    };

    return (
        <button
            ref={buttonRef}
            onPointerMove={mouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onPointerLeave={() => {
                setIsHovered(false);
                // Reset glow to center when mouse leaves
                setMouseX(0.5);
                setMouseY(0.5);
            }}
            className="group relative py-4 px-8 rounded-[20px] bg-zinc-800 overflow-hidden transition-transform duration-300 ease-out hover:scale-[1.02] active:scale-95 shadow-xl"
            style={{
                boxShadow: isHovered ? `0 10px 40px -10px ${hex}66` : '0 10px 30px -10px rgba(0,0,0,0.5)'
            }}
        >
            {/* Hover Effects Container */}
            <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    "--mx": `${mouseX * 100}%`,
                    "--my": `${mouseY * 100}%`
                }}
            >
                {/* Glow Effect */}
                <div 
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                        backgroundImage: `
                            radial-gradient(100% 50% at calc(50% - var(--mx)) 0%, ${hex}66 0%, transparent 80%),
                            radial-gradient(100% 50% at calc(var(--mx) + 50%) 100%, ${hex}66 0%, transparent 80%)
                        `
                    }}
                ></div>
                
                {/* Diagonal Shine Effect */}
                <div 
                    className="absolute inset-0 mix-blend-screen transition-opacity duration-300"
                    style={{
                        backgroundImage: `repeating-linear-gradient(125deg, transparent 0%, transparent 15%, ${hex}40 25%, transparent 35%, transparent 50%)`,
                        backgroundSize: '200%',
                        backgroundPosition: 'calc(var(--mx) + 20%) var(--my)'
                    }}
                ></div>
            </div>

            {/* Inner Button Plate (Creates the gradient border effect) */}
            <div className="absolute inset-[1.5px] rounded-[18.5px] bg-zinc-900/95 backdrop-blur-xl transition-colors duration-300 group-hover:bg-zinc-900/80"></div>

            {/* Button Content */}
            <div 
                className="relative flex items-center justify-center gap-3 font-semibold text-lg tracking-wide transition-colors duration-300"
                style={{ color: isHovered ? hex : '#e4e4e7' }} // text-zinc-200 by default
            >
                {Icon && (
                    <Icon 
                        size={20} 
                        className="transition-transform duration-300 group-hover:scale-110"
                        style={{ filter: isHovered ? `drop-shadow(0 0 8px ${hex}88)` : 'none' }}
                    />
                )}
                <span>{label}</span>
            </div>
        </button>
    );
}