import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function BenefitsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const architectureRef = useRef<HTMLDivElement>(null);

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

    gsap.fromTo(".benefit-card", 
      { opacity: 0, y: 30, scale: 0.9 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.8,
        stagger: 0.2,
        scrollTrigger: {
          trigger: benefitsRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    );

    gsap.fromTo(".architecture-item", 
      { opacity: 0, x: -50 },
      { 
        opacity: 1, 
        x: 0, 
        duration: 0.8,
        stagger: 0.2,
        scrollTrigger: {
          trigger: architectureRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Floating animation for icons
    gsap.to(".floating-icon", {
      y: -15,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      stagger: 0.3
    });

    // Pulse animation for stats
    gsap.to(".stat-number", {
      scale: 1.05,
      duration: 1.5,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      stagger: 0.5
    });

  }, { scope: containerRef });

  return (
    <div id="benefits-section" ref={containerRef} className="py-24 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="container mx-auto px-6">
        {/* Section Title */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl mb-8">
            <span className="text-4xl">💎</span>
          </div>
          <h2 ref={titleRef} className="text-5xl lg:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
              Why Developers Love Us
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Built by developers, for developers. Our platform solves real problems with 
            <br className="hidden lg:block" />
            <span className="text-purple-600">intelligent automation</span>
          </p>
        </div>

        {/* Benefits Grid */}
        <div ref={benefitsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          <div className="benefit-card group">
            <div className="bg-white/80 backdrop-blur-lg border border-purple-200 rounded-3xl p-8 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 transform hover:scale-105">
              <div className="floating-icon w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform duration-300">
                ⏰
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Save Hours Daily</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Stop manually checking dependency compatibility. Our AI does the heavy lifting, 
                analyzing thousands of packages in seconds.
              </p>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Automated conflict resolution</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Instant version recommendations</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Zero manual investigation</span>
                </div>
              </div>
            </div>
          </div>

          <div className="benefit-card group">
            <div className="bg-white/80 backdrop-blur-lg border border-pink-200 rounded-3xl p-8 hover:border-pink-300 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 transform hover:scale-105">
              <div className="floating-icon w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform duration-300">
                🛡️
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Prevent Security Issues</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Stay ahead of vulnerabilities with proactive security scanning and 
                real-time threat intelligence from multiple sources.
              </p>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>CVE database integration</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>Automated security alerts</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>Compliance reporting</span>
                </div>
              </div>
            </div>
          </div>

          <div className="benefit-card group">
            <div className="bg-white/80 backdrop-blur-lg border border-rose-200 rounded-3xl p-8 hover:border-rose-300 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 transform hover:scale-105">
              <div className="floating-icon w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform duration-300">
                🚀
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Ship Faster</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Eliminate dependency-related deployment delays. Get confidence 
                that your code will work in production from day one.
              </p>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                  <span>Production compatibility checks</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                  <span>Environment validation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                  <span>Deployment confidence</span>
                </div>
              </div>
            </div>
          </div>

          <div className="benefit-card group">
            <div className="bg-white/80 backdrop-blur-lg border border-purple-200 rounded-3xl p-8 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 transform hover:scale-105">
              <div className="floating-icon w-20 h-20 bg-gradient-to-br from-purple-500 to-rose-500 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform duration-300">
                🔄
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Stay Current</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Never miss important updates again. Get intelligent notifications 
                about new versions, security patches, and deprecations.
              </p>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Smart update notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Breaking change alerts</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Migration guidance</span>
                </div>
              </div>
            </div>
          </div>

          <div className="benefit-card group">
            <div className="bg-white/80 backdrop-blur-lg border border-pink-200 rounded-3xl p-8 hover:border-pink-300 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 transform hover:scale-105">
              <div className="floating-icon w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform duration-300">
                👥
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Team Collaboration</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Enable your entire team with shared insights. Make dependency 
                decisions transparent and collaborative across all projects.
              </p>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>Shared dependency policies</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>Team-wide notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>Centralized reporting</span>
                </div>
              </div>
            </div>
          </div>

          <div className="benefit-card group">
            <div className="bg-white/80 backdrop-blur-lg border border-rose-200 rounded-3xl p-8 hover:border-rose-300 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 transform hover:scale-105">
              <div className="floating-icon w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform duration-300">
                💡
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Smart Insights</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Get actionable recommendations powered by machine learning. 
                Learn from community best practices and optimization patterns.
              </p>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                  <span>AI-powered recommendations</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                  <span>Community insights</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                  <span>Performance optimization</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Architecture Overview */}
        <div ref={architectureRef} className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-800 mb-4">
              Built on Modern <span className="text-purple-600">Cloud Architecture</span>
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Enterprise-grade infrastructure that scales with your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="architecture-item bg-white/80 backdrop-blur-lg border border-purple-200 rounded-2xl p-8 hover:border-purple-300 transition-all duration-300">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl">
                    ☁️
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-800">Cloudflare Workers</h4>
                    <p className="text-gray-600">Edge computing for global performance</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Deployed across 300+ locations worldwide for sub-100ms response times
                </p>
              </div>

              <div className="architecture-item bg-white/80 backdrop-blur-lg border border-pink-200 rounded-2xl p-8 hover:border-pink-300 transition-all duration-300">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center text-3xl">
                    🧠
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-800">AI Agents</h4>
                    <p className="text-gray-600">Multi-agent system for intelligent analysis</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Specialized agents for resolution, research, and report generation
                </p>
              </div>

              <div className="architecture-item bg-white/80 backdrop-blur-lg border border-rose-200 rounded-2xl p-8 hover:border-rose-300 transition-all duration-300">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl">
                    🔒
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-800">Security First</h4>
                    <p className="text-gray-600">Zero data retention, privacy by design</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Your dependency data never leaves the secure processing environment
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/90 backdrop-blur-lg border border-purple-200 rounded-3xl p-10 shadow-2xl">
                <h4 className="text-3xl font-bold text-gray-800 mb-8 text-center">Performance Stats</h4>
                
                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="text-center">
                    <div className="stat-number text-5xl font-black text-purple-600 mb-3">99.9%</div>
                    <div className="text-gray-600 font-medium">Uptime SLA</div>
                    <div className="w-full bg-purple-100 rounded-full h-2 mt-3">
                      <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full w-full"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="stat-number text-5xl font-black text-pink-600 mb-3">&lt;100ms</div>
                    <div className="text-gray-600 font-medium">Global Latency</div>
                    <div className="w-full bg-pink-100 rounded-full h-2 mt-3">
                      <div className="bg-gradient-to-r from-pink-400 to-rose-500 h-2 rounded-full w-5/6"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="stat-number text-5xl font-black text-purple-600 mb-3">300+</div>
                    <div className="text-gray-600 font-medium">Edge Locations</div>
                    <div className="w-full bg-purple-100 rounded-full h-2 mt-3">
                      <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full w-3/4"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="stat-number text-5xl font-black text-rose-600 mb-3">1M+</div>
                    <div className="text-gray-600 font-medium">Packages Analyzed</div>
                    <div className="w-full bg-rose-100 rounded-full h-2 mt-3">
                      <div className="bg-gradient-to-r from-rose-400 to-pink-500 h-2 rounded-full w-4/5"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                  <div className="text-center text-gray-600">
                    <div className="font-bold mb-3 text-lg">Powered by cutting-edge technology</div>
                    <div className="flex justify-center items-center gap-3 text-sm text-gray-500 flex-wrap">
                      <span className="bg-purple-100 px-3 py-1 rounded-full border border-purple-200">React 19</span>
                      <span className="bg-pink-100 px-3 py-1 rounded-full border border-pink-200">TypeScript</span>
                      <span className="bg-rose-100 px-3 py-1 rounded-full border border-rose-200">GSAP</span>
                      <span className="bg-purple-100 px-3 py-1 rounded-full border border-purple-200">Tailwind CSS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 