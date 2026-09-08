const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(`
            if (aiCleanerBtn) {
                aiCleanerBtn.addEventListener('click', async () => {
                    // This is bound to the current parsed CSV data in the modal
                    // We need to trigger this inside the CSV import flow, or expose the state globally.
                    showToast('✨ Feature coming soon! AI will clean up messy addresses automatically.', 'info');
                });
            }
`, `
            if (aiCleanerBtn) {
                aiCleanerBtn.addEventListener('click', async () => {
                    if (stops.length === 0) {
                        return showToast('⚠️ ကျေးဇူးပြု၍ လိပ်စာ/မှတ်တိုင် ဒေတာ (CSV) အရင်သွင်းပါ', 'warning');
                    }
                    
                    showToast('🧹 AI သည် လိပ်စာများကို စစ်ဆေးပြင်ဆင်ပေးနေပါသည်...', 'info');
                    try {
                        const originalBtnContent = aiCleanerBtn.innerHTML;
                        aiCleanerBtn.innerHTML = '<span>⏳</span> Cleaning...';
                        aiCleanerBtn.disabled = true;

                        // Grab the first 50 stops to prevent API payload from being too huge for demo
                        const sampleStops = stops.slice(0, 50).map(s => ({ id: s.id || s.name, address_text: s.name + ' ' + (s.township || '') }));
                        
                        const res = await fetch('/api/ai/clean-address', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ records: sampleStops })
                        });
                        const cleanedData = await res.json();
                        
                        // Apply cleaned data
                        let count = 0;
                        cleanedData.forEach(cd => {
                            const stop = stops.find(s => (s.id || s.name) === cd.id);
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
`);

fs.writeFileSync('index.html', html);
