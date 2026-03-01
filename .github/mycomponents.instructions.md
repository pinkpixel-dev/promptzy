import React, { useRef, useState } from 'react';
import { Sparkles, Zap, Heart, Bot, Activity, Cpu, Star, Search } from 'lucide-react';

export default function App() {
    const [powerOn, setPowerOn] = useState(true);
    const [overdrive, setOverdrive] = useState(false);

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center py-16 px-6 sm:px-12 font-sans selection:bg-rose-500/30">
            <div className="max-w-5xl w-full space-y-16">
                
                {/* Header Section */}
                <div className="text-center flex flex-col items-center">
                    <div className="p-4 bg-zinc-900 rounded-full mb-6 border border-zinc-800 shadow-[0_0_40px_-10px_rgba(34,211,238,0.25)] relative group">
                        <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <Bot size={56} className="text-cyan-400 relative z-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-yellow-400 to-rose-400 pb-2">
                        Sparkle Bots UI
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
                        Modern, reactive components engineered for maximum badassery. Hover, click, and interact to see the magic.
                    </p>
                </div>

                {/* Dashboard Stats / SugarCards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SugarCard 
                        title="System Cores" 
                        value="99.9%" 
                        hex="#22d3ee" 
                        icon={Cpu} 
                        trend="+2.4%"
                    />
                    <SugarCard 
                        title="Magic Output" 
                        value="1.21 GW" 
                        hex="#fbbf24" 
                        icon={Zap} 
                        trend="Max"
                    />
                    <SugarCard 
                        title="Vibe Check" 
                        value="Flawless" 
                        hex="#f43f8e" 
                        icon={Heart} 
                        trend="💖"
                    />
                </div>

                {/* Controls Section */}
                <div className="flex flex-col lg:flex-row gap-8 items-center justify-center p-8 rounded-[32px] bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-sm">
                    {/* Toggles */}
                    <div className="flex gap-8 px-8 border-r border-zinc-800/50">
                        <SweetToggle 
                            label="Main Power" 
                            hex="#22d3ee" 
                            checked={powerOn} 
                            onChange={setPowerOn} 
                        />
                        <SweetToggle 
                            label="Overdrive" 
                            hex="#f43f8e" 
                            checked={overdrive} 
                            onChange={setOverdrive} 
                        />
                    </div>

                    {/* Input */}
                    <div className="w-full max-w-xs">
                        <CandyInput placeholder="Search bot protocols..." hex="#fbbf24" />
                    </div>
                </div>

                {/* The Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <ShinyButton 
                        label="Cyan Core" 
                        hex="#22d3ee" 
                        icon={Sparkles} 
                    />
                    <ShinyButton 
                        label="Yellow Spark" 
                        hex="#fbbf24" 
                        icon={Star} 
                    />
                    <ShinyButton 
                        label="Rose Petal" 
                        hex="#f43f8e" 
                        icon={Activity} 
                    />
                </div>
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

// ---------------------------------------------------------
// NEW COMPONENTS
// ---------------------------------------------------------

function SugarCard({ title, value, hex, icon: Icon, trend }) {
    return (
        <div className="group relative rounded-[24px] bg-zinc-800/50 p-[1px] overflow-hidden hover:shadow-2xl transition-all duration-500 ease-out"
             style={{
                 boxShadow: `0 0 0 0 ${hex}00`
             }}
             onMouseEnter={(e) => {
                 e.currentTarget.style.boxShadow = `0 10px 40px -10px ${hex}40`;
             }}
             onMouseLeave={(e) => {
                 e.currentTarget.style.boxShadow = `0 0 0 0 ${hex}00`;
             }}
        >
            {/* Animated top glow border */}
            <div 
                className="absolute inset-0 opacity-40 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: `radial-gradient(800px circle at 50% 0%, ${hex}80, transparent 40%)`
                }}
            />
            
            {/* Inner Content Plate */}
            <div className="relative h-full bg-zinc-950/90 backdrop-blur-xl rounded-[23px] p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 transition-colors duration-300 group-hover:bg-zinc-800">
                        <Icon size={24} style={{ color: hex }} className="drop-shadow-lg" />
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                        {trend}
                    </span>
                </div>
                <div>
                    <h3 className="text-zinc-400 text-sm font-medium mb-1">{title}</h3>
                    <p className="text-3xl font-bold text-zinc-100 tracking-tight transition-all duration-300"
                       style={{ textShadow: `0 0 20px ${hex}00` }}
                    >
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}

function CandyInput({ placeholder, hex }) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="relative group w-full">
            {/* Focus Glow Background */}
            <div 
                className={`absolute -inset-0.5 rounded-xl blur opacity-0 transition duration-500`}
                style={{ 
                    backgroundColor: hex,
                    opacity: isFocused ? 0.3 : 0
                }}
            ></div>
            <div className="relative flex items-center">
                <Search size={18} className="absolute left-4 text-zinc-500 transition-colors duration-300" 
                        style={{ color: isFocused ? hex : undefined }} />
                <input
                    type="text"
                    placeholder={placeholder}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm rounded-xl focus:outline-none py-3 pl-11 pr-4 transition-all duration-300"
                    style={{
                        borderColor: isFocused ? hex : undefined,
                        boxShadow: isFocused ? `0 0 0 1px ${hex}` : 'none'
                    }}
                />
            </div>
        </div>
    );
}

function SweetToggle({ label, checked, onChange, hex }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
                <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={checked} 
                    onChange={(e) => onChange(e.target.checked)} 
                />
                {/* Track */}
                <div 
                    className={`block w-12 h-7 rounded-full transition-colors duration-300 border border-zinc-800`}
                    style={{ 
                        backgroundColor: checked ? hex : '#18181b', // zinc-900
                        borderColor: checked ? hex : '#27272a', // zinc-800
                        opacity: checked ? 0.8 : 1
                    }}
                ></div>
                {/* Thumb/Dot */}
                <div 
                    className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-md flex items-center justify-center`}
                    style={{ 
                        transform: checked ? 'translateX(20px)' : 'translateX(0)',
                        boxShadow: checked ? `0 0 10px ${hex}` : '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                >
                    {/* Tiny inner glow on the dot when active */}
                    <div className="w-2 h-2 rounded-full transition-opacity duration-300"
                         style={{ backgroundColor: hex, opacity: checked ? 1 : 0 }}></div>
                </div>
            </div>
            <span className="text-zinc-400 font-medium text-sm group-hover:text-zinc-200 transition-colors">
                {label}
            </span>
        </label>
    );
}

// ---------------------------------------------------------
// EXISTING SHINY BUTTON
// ---------------------------------------------------------

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
            className="group relative py-4 px-8 rounded-[20px] bg-zinc-800 overflow-hidden transition-transform duration-300 ease-out hover:scale-[1.02] active:scale-95 shadow-xl w-full sm:w-auto"
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
            <div className="absolute inset-[1.5px] rounded-[18.5px] bg-zinc-900/95 backdrop-blur-xl transition-colors duration-300 group-hover:bg-zinc-900/80 pointer-events-none"></div>

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