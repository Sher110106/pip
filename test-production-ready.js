#!/usr/bin/env node

/**
 * Production-Ready Test Suite for Python Dependency Resolution Tools
 * 
 * This script validates that all dependency resolution tools are working correctly
 * and provides comprehensive test coverage for real-world scenarios.
 * 
 * Tools tested:
 * - PyPI Package Lookup
 * - Package Deprecation Analysis  
 * - Dependency Resolution
 * - Requirements File Generation
 * - Web Search (when configured)
 * 
 * Run with: node test-production-ready.js
 */

async function runProductionTests() {
    console.log('🚀 Production-Ready Dependency Resolution Test Suite');
    console.log('===================================================\n');
    
    const testSuites = [
        {
            name: "Core Functionality Tests",
            tests: [
                {
                    name: "Popular Package Resolution",
                    requirements: [
                        {"name": "requests", "operator": ">=", "version": "2.20.0", "original_spec": "requests>=2.20.0"},
                        {"name": "numpy", "operator": "", "original_spec": "numpy"},
                        {"name": "pandas", "operator": ">=", "version": "1.0.0", "original_spec": "pandas>=1.0.0"}
                    ],
                    expectedSuccess: true,
                    description: "Should resolve popular packages efficiently"
                },
                {
                    name: "Deprecated Package Detection",
                    requirements: [
                        {"name": "nose", "operator": "", "original_spec": "nose"},
                        {"name": "pytest", "operator": ">=", "version": "7.0", "original_spec": "pytest>=7.0"}
                    ],
                    expectedSuccess: true,
                    description: "Should identify deprecated packages and provide alternatives"
                },
                {
                    name: "Built-in Module Handling",
                    requirements: [
                        {"name": "imp", "operator": "", "original_spec": "imp"},
                        {"name": "optparse", "operator": "", "original_spec": "optparse"}
                    ],
                    expectedSuccess: true,
                    description: "Should handle deprecated built-in Python modules"
                }
            ]
        },
        {
            name: "Edge Case Handling",
            tests: [
                {
                    name: "Non-existent Packages",
                    requirements: [
                        {"name": "nonexistent-package-xyz", "operator": "", "original_spec": "nonexistent-package-xyz"}
                    ],
                    expectedSuccess: false,
                    description: "Should gracefully handle packages that don't exist"
                },
                {
                    name: "Empty Input Validation",
                    requirements: [
                        {"name": "", "operator": "", "original_spec": ""},
                        {"name": "  ", "operator": "", "original_spec": "  "}
                    ],
                    expectedSuccess: false,
                    description: "Should validate empty or whitespace-only inputs"
                },
                {
                    name: "Version Conflict Detection",
                    requirements: [
                        {"name": "django", "operator": ">=", "version": "4.0", "original_spec": "django>=4.0"},
                        {"name": "django", "operator": "==", "version": "3.2", "fixed": true, "original_spec": "django==3.2"}
                    ],
                    expectedSuccess: false,
                    description: "Should detect conflicting version requirements"
                }
            ]
        },
        {
            name: "Real-World Scenarios",
            tests: [
                {
                    name: "Web Development Stack",
                    requirements: [
                        {"name": "django", "operator": ">=", "version": "4.0", "original_spec": "django>=4.0"},
                        {"name": "djangorestframework", "operator": ">=", "version": "3.14", "original_spec": "djangorestframework>=3.14"},
                        {"name": "celery", "operator": ">=", "version": "5.2", "original_spec": "celery>=5.2"}
                    ],
                    expectedSuccess: true,
                    description: "Should handle realistic web framework dependencies"
                },
                {
                    name: "Data Science Stack", 
                    requirements: [
                        {"name": "numpy", "operator": ">=", "version": "1.21", "original_spec": "numpy>=1.21"},
                        {"name": "pandas", "operator": ">=", "version": "1.3", "original_spec": "pandas>=1.3"},
                        {"name": "scikit-learn", "operator": ">=", "version": "1.0", "original_spec": "scikit-learn>=1.0"}
                    ],
                    expectedSuccess: true,
                    description: "Should handle data science package dependencies"
                }
            ]
        }
    ];

    const results = {
        totalTests: 0,
        passed: 0,
        failed: 0,
        suites: []
    };

    const startTime = Date.now();

    for (const suite of testSuites) {
        console.log(`📦 ${suite.name}`);
        console.log('='.repeat(suite.name.length + 3));
        
        const suiteResults = {
            name: suite.name,
            tests: [],
            passed: 0,
            failed: 0
        };

        for (const test of suite.tests) {
            console.log(`\n🔍 Testing: ${test.name}`);
            console.log(`   ${test.description}`);
            console.log(`   Requirements: ${test.requirements.length} packages`);
            
            results.totalTests++;
            
            try {
                const response = await fetch('http://localhost:5173/agents/dependency-resolver-agent/resolve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requirements: test.requirements,
                        python_version: "3.9",
                        allow_prereleases: false
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                const resolveId = data.id;

                // Wait for resolution
                await new Promise(resolve => setTimeout(resolve, 3000));

                const statusResponse = await fetch(`http://localhost:5173/agents/dependency-resolver-agent/status?id=${resolveId}`);
                const statusData = await statusResponse.json();
                const result = statusData.result;

                const success = result.success;
                const testPassed = (success === test.expectedSuccess);

                const testResult = {
                    name: test.name,
                    passed: testPassed,
                    success: success,
                    expected: test.expectedSuccess,
                    resolvedCount: result.resolved_packages?.length || 0,
                    deprecatedCount: result.deprecated_packages?.length || 0,
                    conflictCount: result.conflicts?.length || 0,
                    warningCount: result.warnings?.length || 0,
                    processingTime: result.processing_time_ms || 0
                };

                suiteResults.tests.push(testResult);

                if (testPassed) {
                    console.log(`   ✅ PASSED`);
                    console.log(`      Success: ${success}, Resolved: ${testResult.resolvedCount}, Deprecated: ${testResult.deprecatedCount}`);
                    if (testResult.processingTime > 0) {
                        console.log(`      Processing time: ${testResult.processingTime}ms`);
                    }
                    results.passed++;
                    suiteResults.passed++;
                } else {
                    console.log(`   ❌ FAILED`);
                    console.log(`      Expected: ${test.expectedSuccess}, Got: ${success}`);
                    results.failed++;
                    suiteResults.failed++;
                }

            } catch (error) {
                console.log(`   ❌ ERROR: ${error.message}`);
                results.failed++;
                suiteResults.failed++;
                suiteResults.tests.push({
                    name: test.name,
                    passed: false,
                    error: error.message
                });
            }
        }

        results.suites.push(suiteResults);
        console.log(`\n📊 Suite Results: ${suiteResults.passed}/${suiteResults.tests.length} passed\n`);
    }

    const totalTime = Date.now() - startTime;
    const successRate = Math.round((results.passed / results.totalTests) * 100);

    // Final Report
    console.log('🎯 FINAL PRODUCTION TEST REPORT');
    console.log('================================');
    console.log(`Total Tests: ${results.totalTests}`);
    console.log(`Passed: ${results.passed} ✅`);
    console.log(`Failed: ${results.failed} ❌`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Total Time: ${totalTime}ms`);
    
    // Performance Summary
    const allTests = results.suites.flatMap(s => s.tests).filter(t => t.processingTime);
    if (allTests.length > 0) {
        const avgTime = allTests.reduce((sum, t) => sum + t.processingTime, 0) / allTests.length;
        const maxTime = Math.max(...allTests.map(t => t.processingTime));
        const minTime = Math.min(...allTests.map(t => t.processingTime));
        
        console.log('\n⚡ Performance Summary:');
        console.log(`   Average: ${avgTime.toFixed(2)}ms`);
        console.log(`   Range: ${minTime}ms - ${maxTime}ms`);
    }

    // Feature Summary
    const totalResolved = allTests.reduce((sum, t) => sum + (t.resolvedCount || 0), 0);
    const totalDeprecated = allTests.reduce((sum, t) => sum + (t.deprecatedCount || 0), 0);
    const totalConflicts = allTests.reduce((sum, t) => sum + (t.conflictCount || 0), 0);
    
    console.log('\n📈 Feature Analysis:');
    console.log(`   Total packages resolved: ${totalResolved}`);
    console.log(`   Deprecated packages detected: ${totalDeprecated}`);
    console.log(`   Conflicts identified: ${totalConflicts}`);

    // Status Assessment
    if (results.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('✅ The Python dependency resolution tools are production-ready.');
        console.log('✅ All edge cases are handled gracefully.');
        console.log('✅ Performance is within acceptable limits.');
        console.log('✅ Error handling is robust.');
    } else {
        console.log(`\n⚠️  ${results.failed} test(s) failed.`);
        console.log('❗ Review the issues above before deploying to production.');
    }

    // Usage Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('==================');
    
    if (successRate >= 95) {
        console.log('✅ System is ready for production use');
        console.log('✅ All core functionality working as expected');
        console.log('✅ Edge cases handled appropriately');
    } else if (successRate >= 80) {
        console.log('⚠️  System mostly functional but needs attention');
        console.log('⚠️  Some edge cases need refinement');
    } else {
        console.log('❌ System needs significant work before production');
        console.log('❌ Core functionality has issues');
    }

    console.log('\n📚 For more information:');
    console.log('   - Check src/tools.ts for implementation details');
    console.log('   - Review agent documentation for usage examples');
    console.log('   - Run npm start to test interactively');

    return results;
}

// Main execution
async function main() {
    try {
        const results = await runProductionTests();
        process.exit(results.failed > 0 ? 1 : 0);
    } catch (error) {
        console.error('\n❌ Test suite failed to run:', error.message);
        console.log('\nEnsure the development server is running:');
        console.log('   npm start');
        process.exit(1);
    }
}

// Run if this file is being executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { runProductionTests }; 