import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import SnakeAnimation from "./snake-animation";

gsap.registerPlugin(useGSAP);

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    // Initial setup - hide everything
    gsap.set([titleRef.current, subtitleRef.current, ctaRef.current], {
      opacity: 0,
      y: 30
    });

    // Animate elements with minimal delay
    tl.to(titleRef.current, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out"
    })
    .to(subtitleRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.5")
    .to(ctaRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.3");

  }, { scope: containerRef });

  const scrollToDemo = () => {
    const demoSection = document.getElementById('demo-section');
    if (demoSection) {
      demoSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50">
      {/* Subtle background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-100/30 rounded-full blur-2xl"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-rose-100/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-32 left-40 w-40 h-40 bg-orange-100/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-pink-100/30 rounded-full blur-2xl"></div>
      </div>

      {/* Soft grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDAsIDAsIDAsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative z-10 container mx-auto px-6 text-center">
        {/* Snake Animation as main visual */}
        <div className="mb-16">
          <SnakeAnimation />
        </div>

        {/* Minimal Title */}
        <h1 ref={titleRef} className="text-6xl lg:text-8xl font-black mb-8 leading-tight">
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
            Python Resolver
          </span>
        </h1>

        {/* Minimal subtitle */}
        <p ref={subtitleRef} className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
          AI-powered dependency analysis
        </p>

        {/* Minimal CTA */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={scrollToDemo}
            className="group relative px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 transform hover:scale-105 text-lg"
          >
            <span className="relative z-10 flex items-center gap-3">
              Try It Now
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          
          <button className="group px-10 py-4 border-2 border-gray-300 text-gray-600 font-bold rounded-2xl hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-300 transform hover:scale-105 text-lg">
            <span className="flex items-center gap-3">
              Learn More
            </span>
          </button>
        </div>
      </div>
    </div>
  );
} 