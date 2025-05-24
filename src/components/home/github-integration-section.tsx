import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function GitHubIntegrationSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const workflowRef = useRef<HTMLDivElement>(null);
  const codeExampleRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Animate on scroll
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

    gsap.fromTo(".integration-feature", 
      { opacity: 0, y: 30, scale: 0.9 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.8,
        stagger: 0.2,
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    );

    gsap.fromTo(".workflow-step", 
      { opacity: 0, x: -50 },
      { 
        opacity: 1, 
        x: 0, 
        duration: 0.8,
        stagger: 0.3,
        scrollTrigger: {
          trigger: workflowRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    );

    gsap.fromTo(codeExampleRef.current, 
      { opacity: 0, scale: 0.95 },
      { 
        opacity: 1, 
        scale: 1, 
        duration: 1,
        scrollTrigger: {
          trigger: codeExampleRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Continuous animations
    gsap.to(".github-icon", {
      rotation: 360,
      duration: 20,
      ease: "none",
      repeat: -1
    });

    gsap.to(".pulse-dot", {
      scale: 1.5,
      opacity: 0.3,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      stagger: 0.5
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="py-24 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-6">
        {/* Section Title */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl mb-8">
            <span className="text-4xl">⚡</span>
          </div>
          <h2 ref={titleRef} className="text-5xl lg:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
              GitHub Integration
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Seamlessly integrate with your GitHub workflow for automated dependency analysis, 
            <br className="hidden lg:block" />
            <span className="text-emerald-600">PR reviews</span>, and <span className="text-teal-600">continuous monitoring</span>
          </p>
        </div>

        {/* Integration Features */}
        <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <div className="integration-feature group relative bg-white/80 backdrop-blur-lg border border-emerald-200 rounded-3xl p-8 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 transform hover:scale-105">
            <div className="absolute top-6 right-6">
              <div className="pulse-dot w-4 h-4 bg-emerald-400 rounded-full"></div>
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform duration-300">
              📥
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Pull Request Analysis</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Automatically analyze dependency changes in pull requests and provide detailed reports
            </p>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span>Automated PR comments</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span>Dependency conflict detection</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span>Security vulnerability alerts</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span>Alternative package suggestions</span>
              </li>
            </ul>
          </div>

          <div className="integration-feature group relative bg-white/80 backdrop-blur-lg border border-teal-200 rounded-3xl p-8 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 transform hover:scale-105">
            <div className="absolute top-6 right-6">
              <div className="pulse-dot w-4 h-4 bg-teal-400 rounded-full"></div>
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform duration-300">
              🚀
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">GitHub Actions</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Integrate with your CI/CD pipeline for continuous dependency monitoring
            </p>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                <span>Automated workflow triggers</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                <span>Custom check statuses</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                <span>Detailed action reports</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                <span>Branch protection rules</span>
              </li>
            </ul>
          </div>

          <div className="integration-feature group relative bg-white/80 backdrop-blur-lg border border-green-200 rounded-3xl p-8 hover:border-green-300 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 transform hover:scale-105">
            <div className="absolute top-6 right-6">
              <div className="pulse-dot w-4 h-4 bg-green-400 rounded-full"></div>
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform duration-300">
              🔔
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Smart Notifications</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Get proactive alerts about dependency health and security issues
            </p>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Security advisories</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Deprecation warnings</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Update recommendations</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Scheduled health reports</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Workflow Steps */}
        <div ref={workflowRef} className="mb-24">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-800 mb-4">How It Works</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Four simple steps to transform your development workflow
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Connection Lines */}
              <div className="absolute left-10 top-20 bottom-20 w-0.5 bg-gradient-to-b from-emerald-300 via-teal-300 to-green-300 hidden lg:block"></div>
              
              <div className="space-y-12">
                <div className="workflow-step flex items-center gap-8">
                  <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl border border-emerald-300">
                    1
                  </div>
                  <div className="bg-white/80 backdrop-blur-lg border border-emerald-200 rounded-2xl p-8 flex-1 hover:border-emerald-300 transition-all duration-300">
                    <h4 className="text-2xl font-bold text-gray-800 mb-3 flex items-center gap-3">
                      <span>🔗</span>
                      Connect Repository
                    </h4>
                    <p className="text-gray-600 leading-relaxed">Install our GitHub App and grant permissions to analyze your Python repositories</p>
                  </div>
                </div>

                <div className="workflow-step flex items-center gap-8">
                  <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl border border-teal-300">
                    2
                  </div>
                  <div className="bg-white/80 backdrop-blur-lg border border-teal-200 rounded-2xl p-8 flex-1 hover:border-teal-300 transition-all duration-300">
                    <h4 className="text-2xl font-bold text-gray-800 mb-3 flex items-center gap-3">
                      <span>🔍</span>
                      Automatic Detection
                    </h4>
                    <p className="text-gray-600 leading-relaxed">We automatically detect dependency files (requirements.txt, pyproject.toml, Pipfile) in your PRs</p>
                  </div>
                </div>

                <div className="workflow-step flex items-center gap-8">
                  <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl border border-green-300">
                    3
                  </div>
                  <div className="bg-white/80 backdrop-blur-lg border border-green-200 rounded-2xl p-8 flex-1 hover:border-green-300 transition-all duration-300">
                    <h4 className="text-2xl font-bold text-gray-800 mb-3 flex items-center gap-3">
                      <span>🧠</span>
                      AI Analysis
                    </h4>
                    <p className="text-gray-600 leading-relaxed">Our AI agents analyze dependencies for conflicts, security issues, and deprecated packages</p>
                  </div>
                </div>

                <div className="workflow-step flex items-center gap-8">
                  <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl border border-emerald-300">
                    4
                  </div>
                  <div className="bg-white/80 backdrop-blur-lg border border-emerald-200 rounded-2xl p-8 flex-1 hover:border-emerald-300 transition-all duration-300">
                    <h4 className="text-2xl font-bold text-gray-800 mb-3 flex items-center gap-3">
                      <span>📊</span>
                      Detailed Reports
                    </h4>
                    <p className="text-gray-600 leading-relaxed">Receive comprehensive reports with actionable recommendations directly in your PR comments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div ref={codeExampleRef} className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-800 mb-4">Example PR Comment</h3>
            <p className="text-xl text-gray-600">See how our bot communicates with your team</p>
          </div>
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl overflow-hidden border border-gray-200 shadow-2xl">
            <div className="bg-gradient-to-r from-emerald-100 to-teal-100 px-8 py-6 border-b border-gray-200 flex items-center gap-4">
              <div className="github-icon w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-2xl">
                ⚡
              </div>
              <div>
                <div className="text-gray-800 font-bold text-lg">Python Dependency Resolver Bot</div>
                <div className="text-gray-600 text-sm flex items-center gap-2">
                  <span>commented 2 minutes ago</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200">
                <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  🔍 Dependency Analysis for 
                  <code className="bg-emerald-100 px-3 py-1 rounded-lg text-emerald-700 border border-emerald-200">requirements.txt</code>
                </h4>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-green-600 text-lg font-semibold">
                    <span>✅</span>
                    <span>Analysis completed successfully</span>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="text-gray-800 font-bold mb-4 text-lg">📦 Resolved Packages (3)</div>
                      <div className="space-y-3 text-gray-600 ml-4">
                        <div className="flex items-center gap-3">
                          <span>•</span>
                          <strong>numpy</strong> → 
                          <code className="bg-emerald-100 px-2 py-1 rounded border border-emerald-200 text-emerald-700">1.24.3</code>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>•</span>
                          <strong>pandas</strong> → 
                          <code className="bg-emerald-100 px-2 py-1 rounded border border-emerald-200 text-emerald-700">2.0.1</code>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>•</span>
                          <strong>requests</strong> → 
                          <code className="bg-emerald-100 px-2 py-1 rounded border border-emerald-200 text-emerald-700">2.31.0</code>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                      <div className="text-yellow-700 font-bold mb-4 text-lg">⚠️ Deprecated Packages (1)</div>
                      <div className="space-y-3 text-gray-600 ml-4">
                        <div className="flex items-center gap-3">
                          <span>•</span>
                          <strong>fabric</strong> 
                          <code className="bg-yellow-100 px-2 py-1 rounded border border-yellow-200 text-yellow-700 ml-2">1.14.0</code>
                        </div>
                        <div className="text-gray-500 ml-6 text-sm">Reason: No longer maintained, last update 2019</div>
                        <div className="text-emerald-600 ml-6 flex items-center gap-2">
                          <span>💡</span>
                          <span>Consider: </span>
                          <code className="bg-emerald-100 px-2 py-1 rounded border border-emerald-200">fabric2</code>
                          <span>or</span>
                          <code className="bg-emerald-100 px-2 py-1 rounded border border-emerald-200">invoke</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-emerald-200 text-center">
                  <span className="text-gray-500">
                    <em>Powered by 
                      <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium ml-1">
                        Python Dependency Resolver
                      </a>
                    </em>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 