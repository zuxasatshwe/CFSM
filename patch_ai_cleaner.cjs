const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const cleanerHtml = `
                    </div>
                    <!-- AI Address Cleaner Feature -->
                    <button id="aiCleanerBtn" type="button" class="w-full mt-2 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm">
                        <span>✨</span> AI Address Cleaner (လိပ်စာ/မြို့နယ် မှန်ကန်ရေး)
                    </button>
`;

html = html.replace('Auto-detects: Name, Lat, Lng & PAX\n                                </div>\n                            </div>\n                        </div>\n                    </div>', 'Auto-detects: Name, Lat, Lng & PAX\n                                </div>\n                            </div>\n                        </div>\n' + cleanerHtml);

fs.writeFileSync('index.html', html);
