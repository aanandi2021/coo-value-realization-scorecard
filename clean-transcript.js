// Consolidate a WebVTT transcript into speaker-grouped paragraphs for easier review.
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'ai-day-transcript.vtt');
const DST = path.join(__dirname, 'ai-day-transcript.cleaned.txt');

const raw = fs.readFileSync(SRC, 'utf8');
const lines = raw.split(/\r?\n/);

// Parse: lines starting with <v Speaker>text</v>
const utterances = [];
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  const m = line.match(/^<v ([^>]+)>(.*)$/);
  if (!m) continue;
  let speaker = m[1].trim();
  let text = m[2];
  // The text may span multiple lines; collect until </v> appears.
  while (!text.includes('</v>') && i + 1 < lines.length) {
    i++;
    text += ' ' + lines[i];
  }
  text = text.replace(/<\/v>.*$/, '').trim();
  if (!text) continue;
  utterances.push({ speaker, text });
}

// Merge consecutive same-speaker utterances.
const merged = [];
for (const u of utterances) {
  if (merged.length && merged[merged.length - 1].speaker === u.speaker) {
    merged[merged.length - 1].text += ' ' + u.text;
  } else {
    merged.push({ ...u });
  }
}

// Filter out very short interjections (less than 4 words AND total under 20 chars)
// — these are mostly "yeah", "right", "okay" backchannels that add no signal.
const cleaned = merged.filter(u => {
  const wc = u.text.split(/\s+/).length;
  return !(wc < 4 && u.text.length < 20);
});

// Re-merge consecutive same-speaker after filtering interjections.
const final = [];
for (const u of cleaned) {
  if (final.length && final[final.length - 1].speaker === u.speaker) {
    final[final.length - 1].text += ' ' + u.text;
  } else {
    final.push({ ...u });
  }
}

const out = final.map(u => `## ${u.speaker}\n${u.text}\n`).join('\n');
fs.writeFileSync(DST, out);
console.log(`Wrote ${final.length} consolidated turns to ${DST}`);
console.log(`Original lines: ${lines.length}, Output bytes: ${out.length}`);
