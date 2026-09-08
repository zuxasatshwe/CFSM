const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Add AI Smart Clustering Button
const aiClusterBtnHtml = `
            <button id="aiClusterBtn" class="w-full mt-2 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white text-[11px] font-bold rounded shadow transition flex justify-center items-center gap-1.5 cursor-pointer">
                <span>✨</span> AI Smart Clustering
            </button>
`;
html = html.replace(
    '</button>\n            <div class="grid grid-cols-2 gap-1.5 mt-2">',
    '</button>\n' + aiClusterBtnHtml + '            <div class="grid grid-cols-2 gap-1.5 mt-2">'
);

// 2. Add AI Route Insights & Anomaly Detection Buttons
const aiInsightsBtnHtml = `
                    <button id="aiInsightsBtn" class="text-[10px] font-bold px-2 py-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white rounded transition items-center gap-1 shadow-sm uppercase tracking-wider flex">
                        <span>✨</span> AI Insights
                    </button>
                    <button id="aiAnomalyBtn" class="text-[10px] font-bold px-2 py-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded transition items-center gap-1 shadow-sm uppercase tracking-wider flex" title="Detect Geographic Anomalies">
                        <span>🔍</span> Anomaly Scan
                    </button>
`;
html = html.replace(
    '<button id="focusMatchesBtn"',
    aiInsightsBtnHtml + '\n                    <button id="focusMatchesBtn"'
);

// 3. Add AI Address Cleaner Button
const aiCleanerBtnHtml = `
                        <button id="aiCleanerBtn" type="button" class="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 mt-2">
                            <span>🧹</span> AI Address Cleaner
                        </button>
`;
// find where to put it. The import modal has "confirmImportBtn"
html = html.replace(
    '<button id="confirmImportBtn"',
    aiCleanerBtnHtml + '\n                        <button id="confirmImportBtn"'
);

// Add JS logic
const aiLogicJs = `
        // --- AI Features (Gemini Integration) ---
        const initAIFeatures = () => {
            const aiClusterBtn = document.getElementById('aiClusterBtn');
            const aiInsightsBtn = document.getElementById('aiInsightsBtn');
            const aiAnomalyBtn = document.getElementById('aiAnomalyBtn');
            const aiCleanerBtn = document.getElementById('aiCleanerBtn');

            if (aiClusterBtn) {
                aiClusterBtn.addEventListener('click', async () => {
                    if (stops.length < 3) {
                        return showToast('⚠️ Not enough stops to cluster (requires 3+).', 'warning');
                    }
                    
                    showToast('✨ AI is clustering your stops geographically...', 'info');
                    try {
                        const originalBtnContent = aiClusterBtn.innerHTML;
                        aiClusterBtn.innerHTML = '<span>⏳</span> Processing...';
                        aiClusterBtn.disabled = true;

                        const numClusters = prompt('How many clusters/zones do you want to group these stops into?', '2');
                        if (!numClusters || isNaN(numClusters)) {
                            aiClusterBtn.innerHTML = originalBtnContent;
                            aiClusterBtn.disabled = false;
                            return;
                        }

                        const res = await fetch('/api/ai/cluster', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ stops, numClusters: parseInt(numClusters, 10) })
                        });
                        const clusters = await res.json();
                        
                        if (clusters && clusters.length > 0) {
                            let report = '<b>✨ AI Smart Clustering Results:</b><br><br>';
                            clusters.forEach((c, idx) => {
                                report += \`<b>\${idx + 1}. \${c.clusterName}</b>: \${c.stopIds.length} stops<br>\`;
                            });
                            
                            showConfirmModal({
                                title: 'AI Clustering Complete',
                                message: report + '<br><i>(Check browser console for full ID mapping)</i>',
                                confirmText: 'OK',
                                cancelText: 'Close',
                                confirmColor: 'purple',
                                icon: '✨',
                                onConfirm: () => {}
                            });
                            console.log("AI Clusters:", clusters);
                        } else {
                            showToast('⚠️ AI could not cluster the stops.', 'error');
                        }
                    } catch (e) {
                        showToast('❌ AI Clustering failed: ' + e.message, 'error');
                    } finally {
                        aiClusterBtn.innerHTML = '<span>✨</span> AI Smart Clustering';
                        aiClusterBtn.disabled = false;
                    }
                });
            }

            if (aiInsightsBtn) {
                aiInsightsBtn.addEventListener('click', async () => {
                    const r = optimizedStops.length > 0 ? optimizedStops : stops;
                    if (r.length < 2) return showToast('⚠️ Not enough stops for insights.', 'warning');
                    
                    showToast('✨ AI is analyzing the route...', 'info');
                    try {
                        const originalBtnContent = aiInsightsBtn.innerHTML;
                        aiInsightsBtn.innerHTML = '<span>⏳</span> Analyzing...';
                        aiInsightsBtn.disabled = true;

                        const res = await fetch('/api/ai/insights', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ route: { stops: r } })
                        });
                        const data = await res.json();
                        
                        showConfirmModal({
                            title: '✨ AI Route Insights & Recommendations',
                            message: data.text ? data.text.replace(/\\n/g, '<br>') : 'No insights generated.',
                            confirmText: 'Got it',
                            cancelText: 'Close',
                            confirmColor: 'purple',
                            icon: '💡',
                            onConfirm: () => {}
                        });
                    } catch (e) {
                        showToast('❌ AI Insights failed: ' + e.message, 'error');
                    } finally {
                        aiInsightsBtn.innerHTML = '<span>✨</span> AI Insights';
                        aiInsightsBtn.disabled = false;
                    }
                });
            }

            if (aiAnomalyBtn) {
                aiAnomalyBtn.addEventListener('click', async () => {
                    const r = optimizedStops.length > 0 ? optimizedStops : stops;
                    if (r.length < 3) return showToast('⚠️ Not enough stops for anomaly detection.', 'warning');
                    
                    showToast('🔍 AI is scanning for anomalies...', 'info');
                    try {
                        const originalBtnContent = aiAnomalyBtn.innerHTML;
                        aiAnomalyBtn.innerHTML = '<span>⏳</span> Scanning...';
                        aiAnomalyBtn.disabled = true;

                        const res = await fetch('/api/ai/anomaly', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ route: { stops: r } })
                        });
                        const data = await res.json();
                        
                        if (data.hasAnomaly) {
                            showConfirmModal({
                                title: '🚨 Geographic Anomaly Detected!',
                                message: \`<b>Reason:</b> \${data.reason}<br><br><b>Anomalous Stops ID(s):</b> \${data.anomalousStopIds.join(', ')}\`,
                                confirmText: 'Review Route',
                                cancelText: 'Ignore',
                                confirmColor: 'red',
                                icon: '🔍',
                                onConfirm: () => {}
                            });
                        } else {
                            showToast('✅ AI Scan passed! No geographic anomalies detected.', 'success');
                        }
                    } catch (e) {
                        showToast('❌ AI Anomaly Scan failed: ' + e.message, 'error');
                    } finally {
                        aiAnomalyBtn.innerHTML = '<span>🔍</span> Anomaly Scan';
                        aiAnomalyBtn.disabled = false;
                    }
                });
            }

            if (aiCleanerBtn) {
                aiCleanerBtn.addEventListener('click', async () => {
                    // This is bound to the current parsed CSV data in the modal
                    // We need to trigger this inside the CSV import flow, or expose the state globally.
                    showToast('✨ Feature coming soon! AI will clean up messy addresses automatically.', 'info');
                });
            }
        };

        // Call init after a short delay
        setTimeout(initAIFeatures, 1000);
`;

html = html.replace('// --- AI Features (Gemini Integration) ---', ''); // clean up if exists
html = html.replace('// --- Final Global Initializations ---', aiLogicJs + '\n        // --- Final Global Initializations ---');

fs.writeFileSync('index.html', html);
