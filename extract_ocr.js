const fs = require('fs');

const transcriptPath = '/.aistudio/artifacts/brain/37217526-3de2-4554-9670-b454bffb7493/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

let fullText = '';
for (const line of lines) {
    if (!line.trim()) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.role === 'user' && obj.content && obj.content.includes('==Start of PDF==')) {
            fullText = obj.content;
        }
    } catch (e) {}
}

const startIdx = fullText.indexOf('==Start of PDF==');
const endIdx = fullText.indexOf('==End of PDF==');
if (startIdx !== -1 && endIdx !== -1) {
    const pdfText = fullText.substring(startIdx, endIdx);
    fs.writeFileSync('pdf_ocr_raw.txt', pdfText);
    console.log('Extracted PDF text to pdf_ocr_raw.txt');
} else {
    console.log('Could not find PDF markers');
}
