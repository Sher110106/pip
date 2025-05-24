import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface DemoStep {
  id: number;
  title: string;
  description: string;
  input: string;
  output: string;
  status: 'idle' | 'analyzing' | 'complete';
}

export default function LiveDemoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  
  const [currentStep, setCurrentStep] = useState<DemoStep>({
    id: 1,
    title: "Analyze Dependencies",
    description: "See how our AI analyzes Python dependencies in real-time",
    input: "numpy>=1.19.0\npandas>=1.3.0\ndjango==3.2.5\nfabric==1.14.0",
    output: "",
    status: 'idle'
  });

  const [isRunningDemo, setIsRunningDemo] = useState(false);

  useGSAP(() => {
    gsap.fromTo(titleRef.current, 
      { opacity: 0, y: 50 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 1,
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    );

    gsap.fromTo(demoRef.current, 
      { opacity: 0, scale: 0.95 },
      { 
        opacity: 1, 
        scale: 1, 
        duration: 1,
        scrollTrigger: {
          trigger: demoRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Typing animation for the demo output
    gsap.to(".cursor", {
      opacity: 0,
      duration: 0.8,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    });

  }, { scope: containerRef });

  const runDemo = async () => {
    if (isRunningDemo) return;
    
    setIsRunningDemo(true);
    setCurrentStep(prev => ({ ...prev, status: 'analyzing', output: "" }));

    // Simulate analysis with typing effect
    const analysisSteps = [
      "🔍 Analyzing dependencies...",
      "📦 Resolving package versions...",
      "⚠️ Checking for deprecated packages...",
      "🔒 Scanning for security vulnerabilities...",
      "✅ Analysis complete!"
    ];

    for (let i = 0; i < analysisSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentStep(prev => ({ 
        ...prev, 
        output: prev.output + analysisSteps[i] + "\n"
      }));
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const finalOutput = `📊 DEPENDENCY ANALYSIS REPORT

✅ RESOLVED PACKAGES (3)
• numpy → 1.24.3 (latest stable)
• pandas → 2.0.1 (latest stable) 
• django → 3.2.5 (LTS version)

⚠️ DEPRECATED PACKAGES (1)
• fabric → 1.14.0
  └─ ⚠️ Last updated: 2019
  └─ 💡 Alternatives: fabric2, invoke

🔒 SECURITY SCAN
• No known vulnerabilities found
• All packages are from trusted sources

🎯 RECOMMENDATIONS
• Consider upgrading django to 4.2 LTS
• Replace fabric with fabric2 for continued support
• All packages have clean dependency trees

Processing time: 1.2s`;

    setCurrentStep(prev => ({ 
      ...prev, 
      status: 'complete',
      output: finalOutput
    }));
    
    setIsRunningDemo(false);
  };

  return (
    <div ref={containerRef} className="py-24 bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <div className="container mx-auto px-6">
        {/* Section Title */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-xl mb-8">
            <span className="text-4xl">🎯</span>
          </div>
          <h2 ref={titleRef} className="text-5xl lg:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 bg-clip-text text-transparent">
              See It In Action
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Experience the power of AI-driven dependency analysis with our 
            <br className="hidden lg:block" />
            <span className="text-blue-600">interactive demo</span>
          </p>
        </div>

        {/* Live Demo */}
        <div ref={demoRef} className="max-w-7xl mx-auto">
          <div className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-3xl overflow-hidden shadow-2xl">
            {/* Demo Header */}
            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 border-b border-gray-200 px-8 py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-3 flex items-center gap-3">
                    <span>⚡</span>
                    {currentStep.title}
                  </h3>
                  <p className="text-gray-600 text-lg">{currentStep.description}</p>
                </div>
                <button
                  onClick={runDemo}
                  disabled={isRunningDemo}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunningDemo ? (
                    <span className="flex items-center gap-3">
                      <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <span>🚀</span>
                      Run Analysis
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Input Panel */}
              <div className="p-8 border-r border-gray-200">
                <div className="mb-6">
                  <label className="block text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                    <span>📄</span>
                    requirements.txt
                  </label>
                </div>
                <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-300 shadow-xl">
                  <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b border-gray-300">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600 text-sm font-mono ml-2">requirements.txt</span>
                  </div>
                  <div className="p-6">
                    <pre className="text-blue-400 font-mono text-sm leading-relaxed">
                      {currentStep.input}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Output Panel */}
              <div className="p-8">
                <div className="mb-6">
                  <label className="block text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                    <span>📊</span>
                    Analysis Results
                  </label>
                </div>
                <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-300 shadow-xl h-96">
                  <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b border-gray-300">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600 text-sm font-mono ml-2">terminal</span>
                  </div>
                  <div className="p-6 h-full overflow-y-auto">
                    {currentStep.output ? (
                      <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                        {currentStep.output}
                        {currentStep.status === 'analyzing' && <span className="cursor">|</span>}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center text-4xl mb-4 mx-auto">
                            ⚡
                          </div>
                          <p className="text-lg font-medium">Click "Run Analysis" to see AI in action</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <div className="bg-gray-50 border-t border-gray-200 px-8 py-6">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      currentStep.status === 'idle' ? 'bg-gray-400' :
                      currentStep.status === 'analyzing' ? 'bg-yellow-500 animate-pulse' :
                      'bg-green-500'
                    }`}></div>
                    <span className="text-gray-600 font-medium">
                      Status: {
                        currentStep.status === 'idle' ? 'Ready' :
                        currentStep.status === 'analyzing' ? 'Analyzing' :
                        'Complete'
                      }
                    </span>
                  </div>
                  <div className="text-gray-600 flex items-center gap-2">
                    <span>🐍</span>
                    <span>Python 3.11</span>
                    <span>•</span>
                    <span>📦</span>
                    <span>4 packages</span>
                    <span>•</span>
                    <span>⚡</span>
                    <span>AI-powered</span>
                  </div>
                </div>
                <div className="text-gray-500 flex items-center gap-2">
                  <span>☁️</span>
                  <span>Powered by Cloudflare Workers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <div className="bg-white/80 backdrop-blur-lg border border-blue-200 rounded-2xl p-8 text-center hover:border-blue-300 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
                ⚡
              </div>
              <h4 className="text-gray-800 font-bold mb-3 text-lg">Lightning Fast</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Sub-second analysis powered by edge computing</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-lg border border-cyan-200 rounded-2xl p-8 text-center hover:border-cyan-300 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
                🧠
              </div>
              <h4 className="text-gray-800 font-bold mb-3 text-lg">AI-Powered</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Advanced ML models for accurate analysis</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-lg border border-sky-200 rounded-2xl p-8 text-center hover:border-sky-300 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-500 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
                🔒
              </div>
              <h4 className="text-gray-800 font-bold mb-3 text-lg">Secure</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Zero data retention, privacy-first approach</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-lg border border-blue-200 rounded-2xl p-8 text-center hover:border-blue-300 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
                🌍
              </div>
              <h4 className="text-gray-800 font-bold mb-3 text-lg">Global Scale</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Available worldwide via Cloudflare network</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 