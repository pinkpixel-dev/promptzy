import React, { useRef, useState, useCallback } from "react";

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  hex: string;
  size?: "sm" | "default" | "lg";
}

const sizeClasses: Record<string, string> = {
  sm: "py-2 px-4 text-sm rounded-[14px]",
  default: "py-3 px-6 text-base rounded-[18px]",
  lg: "py-4 px-8 text-lg rounded-[20px]",
};

const innerRadius: Record<string, string> = {
  sm: "rounded-[12.5px]",
  default: "rounded-[16.5px]",
  lg: "rounded-[18.5px]",
};

const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
  ({ children, hex, className = "", size = "default", style, onPointerMove, onMouseEnter, onPointerLeave, ...props }, forwardedRef) => {
    const innerRef = useRef<HTMLButtonElement>(null);
    const [mouseX, setMouseX] = useState(0.5);
    const [mouseY, setMouseY] = useState(0.5);
    const [isHovered, setIsHovered] = useState(false);

    const setRefs = useCallback(
      (node: HTMLButtonElement | null) => {
        (innerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      },
      [forwardedRef]
    );

    const handleMouseMove = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!innerRef.current) return;
      const rect = innerRef.current.getBoundingClientRect();
      setMouseX((e.clientX - rect.left) / rect.width);
      setMouseY((e.clientY - rect.top) / rect.height);
    };

    return (
      <button
        ref={setRefs}
        {...props}
        onPointerMove={(e) => { handleMouseMove(e); onPointerMove?.(e); }}
        onMouseEnter={(e) => { setIsHovered(true); onMouseEnter?.(e); }}
        onPointerLeave={(e) => { setIsHovered(false); setMouseX(0.5); setMouseY(0.5); onPointerLeave?.(e); }}
        className={`group relative ${sizeClasses[size]} bg-zinc-800 overflow-hidden transition-transform duration-300 ease-out hover:scale-[1.02] active:scale-95 shadow-xl disabled:opacity-50 disabled:pointer-events-none ${className}`}
        style={{
          boxShadow: isHovered ? `0 10px 40px -10px ${hex}66` : "0 10px 30px -10px rgba(0,0,0,0.5)",
          ...style,
        }}
      >
        {/* Hover Effects Container */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            "--mx": `${mouseX * 100}%`,
            "--my": `${mouseY * 100}%`,
          } as React.CSSProperties}
        >
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              backgroundImage: `
                radial-gradient(100% 50% at calc(50% - var(--mx)) 0%, ${hex}66 0%, transparent 80%),
                radial-gradient(100% 50% at calc(var(--mx) + 50%) 100%, ${hex}66 0%, transparent 80%)
              `,
            }}
          />
          <div
            className="absolute inset-0 mix-blend-screen transition-opacity duration-300"
            style={{
              backgroundImage: `repeating-linear-gradient(125deg, transparent 0%, transparent 15%, ${hex}40 25%, transparent 35%, transparent 50%)`,
              backgroundSize: "200%",
              backgroundPosition: "calc(var(--mx) + 20%) var(--my)",
            }}
          />
        </div>

        {/* Inner Button Plate */}
        <div className={`absolute inset-[1.5px] ${innerRadius[size]} bg-zinc-900/95 backdrop-blur-xl transition-colors duration-300 group-hover:bg-zinc-900/80`} />

        {/* Button Content */}
        <div
          className="relative flex items-center justify-center gap-2 font-semibold tracking-wide transition-colors duration-300"
          style={{ color: isHovered ? hex : "#e4e4e7" }}
        >
          {children}
        </div>
      </button>
    );
  }
);

ShinyButton.displayName = "ShinyButton";

export default ShinyButton;
