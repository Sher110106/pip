import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export default function SnakeAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Create a more dynamic snake movement
    gsap.fromTo(".snake-segment", {
      opacity: 0,
      scale: 0
    }, {
      opacity: 1,
      scale: 1,
      duration: 0.3,
      stagger: 0.2,
      ease: "power2.out",
      repeat: -1,
      repeatDelay: 2
    });

    // Add floating animation to the whole snake
    gsap.to(".snake-container", {
      y: -10,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative flex items-center justify-center">
      <div className="snake-container">
        {/* Pixelated Snake */}
        <div className="relative">
          {/* Snake Body - Grid-based pixels */}
          <div className="flex flex-col gap-1">
            {/* Row 1 */}
            <div className="flex gap-1">
              <div className="snake-segment w-4 h-4 bg-emerald-500 shadow-lg"></div>
              <div className="snake-segment w-4 h-4 bg-emerald-400 shadow-lg" style={{animationDelay: '0.1s'}}></div>
              <div className="snake-segment w-4 h-4 bg-emerald-500 shadow-lg" style={{animationDelay: '0.2s'}}></div>
              <div className="snake-segment w-4 h-4 bg-emerald-400 shadow-lg" style={{animationDelay: '0.3s'}}></div>
            </div>
            
            {/* Row 2 */}
            <div className="flex gap-1">
              <div className="w-4 h-4"></div>
              <div className="w-4 h-4"></div>
              <div className="w-4 h-4"></div>
              <div className="snake-segment w-4 h-4 bg-emerald-500 shadow-lg" style={{animationDelay: '0.4s'}}></div>
            </div>
            
            {/* Row 3 */}
            <div className="flex gap-1">
              <div className="w-4 h-4"></div>
              <div className="w-4 h-4"></div>
              <div className="w-4 h-4"></div>
              <div className="snake-segment w-4 h-4 bg-emerald-400 shadow-lg" style={{animationDelay: '0.5s'}}></div>
            </div>
            
            {/* Row 4 */}
            <div className="flex gap-1">
              <div className="w-4 h-4"></div>
              <div className="w-4 h-4"></div>
              <div className="snake-segment w-4 h-4 bg-emerald-500 shadow-lg" style={{animationDelay: '0.6s'}}></div>
              <div className="snake-segment w-4 h-4 bg-emerald-400 shadow-lg" style={{animationDelay: '0.7s'}}></div>
            </div>
            
            {/* Row 5 */}
            <div className="flex gap-1">
              <div className="snake-segment w-4 h-4 bg-emerald-500 shadow-lg" style={{animationDelay: '0.8s'}}></div>
              <div className="snake-segment w-4 h-4 bg-emerald-400 shadow-lg" style={{animationDelay: '0.9s'}}></div>
              <div className="snake-segment w-4 h-4 bg-emerald-500 shadow-lg" style={{animationDelay: '1.0s'}}></div>
              <div className="w-4 h-4"></div>
            </div>
            
            {/* Row 6 - Snake Head */}
            <div className="flex gap-1">
              <div className="w-4 h-4"></div>
              <div className="snake-segment w-4 h-4 bg-emerald-600 shadow-xl border border-emerald-700 relative" style={{animationDelay: '1.1s'}}>
                {/* Snake Eyes */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                    <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="w-4 h-4"></div>
              <div className="w-4 h-4"></div>
            </div>
          </div>
          
          {/* Food/Apple */}
          <div className="absolute -top-2 right-0">
            <div className="w-3 h-3 bg-rose-500 rounded-sm shadow-lg animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Custom CSS for snake animation */}
      <style jsx>{`
        .snake-segment {
          position: relative;
          background: linear-gradient(135deg, currentColor 0%, currentColor 100%);
          border-radius: 2px;
          animation: snakeMove 3s ease-in-out infinite;
        }
        
        @keyframes snakeMove {
          0%, 100% {
            transform: scale(1) translateX(0);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          }
          25% {
            transform: scale(1.1) translateX(2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }
          50% {
            transform: scale(1) translateX(0);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          }
          75% {
            transform: scale(1.05) translateX(-1px);
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
          }
        }
      `}</style>
    </div>
  );
} 