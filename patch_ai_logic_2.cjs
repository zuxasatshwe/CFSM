const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const aiCleanerBtnHtml = `
                    <!-- AI Address Cleaner Feature -->
                    <button id="aiCleanerBtn" type="button" class="w-full mt-2 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm">
                        <span>✨</span> AI Address Cleaner (လိပ်စာ/မြို့နယ် မှန်ကန်ရေး)
                    </button>
`;

html = html.replace('<!-- Enhanced Interactive Dropzone -->', aiCleanerBtnHtml + '\n                    <!-- Enhanced Interactive Dropzone -->');

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
                        aiClusterBtn.innerHTML = '<span>✨</span> AI Smart Clustering (အုပ်စုခွဲမည်)';
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
                    if (stops.length === 0 && (!window.CapacityRoutePlannerEngine || !window.CapacityRoutePlannerEngine.state.modeC.csvImportedStops || window.CapacityRoutePlannerEngine.state.modeC.csvImportedStops.length === 0)) {
                        return showToast('⚠️ ကျေးဇူးပြု၍ လိပ်စာ/မှတ်တိုင် ဒေတာ (CSV) အရင်သွင်းပါ', 'warning');
                    }
                    
                    showToast('🧹 AI သည် လိပ်စာများကို စစ်ဆေးပြင်ဆင်ပေးနေပါသည်...', 'info');
                    try {
                        const originalBtnContent = aiCleanerBtn.innerHTML;
                        aiCleanerBtn.innerHTML = '<span>⏳</span> Cleaning...';
                        aiCleanerBtn.disabled = true;

                        // Clean active stops or CSV imported stops
                        let activeData = stops;
                        if (stops.length === 0 && window.CapacityRoutePlannerEngine) {
                            activeData = window.CapacityRoutePlannerEngine.state.modeC.csvImportedStops || [];
                        }

                        // Grab the first 50 stops to prevent API payload from being too huge for demo
                        const sampleStops = activeData.slice(0, 50).map(s => ({ id: s.id || s.name, address_text: s.name + ' ' + (s.township || '') }));
                        
                        const res = await fetch('/api/ai/clean-address', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ records: sampleStops })
                        });
                        const cleanedData = await res.json();
                        
                        // Apply cleaned data
                        let count = 0;
                        cleanedData.forEach(cd => {
                            const stop = activeData.find(s => (s.id || s.name) === cd.id);
                            if (stop) {
                                stop.name = cd.cleanedAddress || stop.name;
                                stop.township = cd.township || stop.township;
                                count++;
                            }
                        });
                        
                        // Update UI
                        if (typeof updateUI === 'function') updateUI();
                        if (typeof renderStopsList === 'function') renderStopsList();
                        if (typeof renderDynamicRouteGeoJSON === 'function' && routeGeoJSON) {
                            renderDynamicRouteGeoJSON(routeGeoJSON);
                        }
                        
                        showConfirmModal({
                            title: '✨ AI Address Cleaned Successfully!',
                            message: \`<b>\${count}</b> ခုသော လိပ်စာများကို AI မှ မှန်ကန်အောင် အလိုအလျောက် ပြင်ဆင်ပေးလိုက်ပါသည်။<br>(Successfully standardized Townships & Addresses)\`,
                            confirmText: 'OK',
                            cancelText: 'Close',
                            confirmColor: 'purple',
                            icon: '🧹',
                            onConfirm: () => {}
                        });
                    } catch (e) {
                        showToast('❌ AI Address Cleaner failed: ' + e.message, 'error');
                    } finally {
                        aiCleanerBtn.innerHTML = '<span>✨</span> AI Address Cleaner (လိပ်စာ/မြို့နယ် မှန်ကန်ရေး)';
                        aiCleanerBtn.disabled = false;
                    }
                });
            }
        };

        // Call init after a short delay
        setTimeout(initAIFeatures, 1000);
`;

html = html.replace('// --- Final Global Initializations ---', aiLogicJs + '\n        // --- Final Global Initializations ---');

fs.writeFileSync('index.html', html);
