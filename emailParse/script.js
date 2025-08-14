// Place-to-county lookup for PA
const placeToCounty = {
  "Philadelphia": "Philadelphia",
  "Norristown": "Montgomery",
  "Doylestown": "Bucks",
  "West Chester": "Chester",
  "Media": "Delaware",
  // Add more place mappings as needed
};

function parseEmails(emailText) {
  const emails = emailText.split(/^From:\s*/m).filter(block => block.trim());
  const parsed = [];
  emails.forEach(raw => {
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let name = '', email = '', date = '', time = '', subject = '';
    let bodyLines = [];
    // Sender
    if (lines[0]) {
      const senderMatch = lines[0].match(/(.*?)<([^>]+)>/);
      if (senderMatch) {
        name = senderMatch[1].trim();
        email = senderMatch[2].trim();
      } else {
        name = lines[0];
      }
    }
    // Subject, Date/Time, Body
    for (let i = 1; i < lines.length; i++) {
      if (!subject && lines[i].startsWith('Subject:')) {
        subject = lines[i].replace(/Subject:\s*/, '');
        continue;
      }
      if (!date && lines[i].match(/^[A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}/)) {
        const dtMatch = lines[i].match(/^([A-Za-z]+),\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\s+([0-9:APM ]+)$/);
        if (dtMatch) {
          date = `${dtMatch[2]} ${dtMatch[3]}, ${dtMatch[4]}`;
          time = dtMatch[5].trim();
        }
        continue;
      }
      if (
        lines[i].startsWith('You don\'t often get email') ||
        lines[i].includes('CAUTION: This is an External Email') ||
        lines[i].startsWith('---') ||
        lines[i].startsWith('Sent from my iPhone') ||
        lines[i].startsWith('CONFIDENTIALITY NOTICE')
      ) {
        continue;
      }
      if (
        subject &&
        !lines[i].startsWith('Sent:') &&
        !lines[i].startsWith('To:') &&
        !lines[i].startsWith('Cc:') &&
        !lines[i].startsWith('Bcc:')
      ) {
        bodyLines.push(lines[i]);
      }
    }
    const body = bodyLines.join('\n').trim();
    parsed.push({ name, email, date, time, subject, body });
  });
  return parsed;
}

// AI-powered county inference and summarization using transformers.js
async function enrichEmailsWithAI(emails) {
  // Show spinner
  document.getElementById('spinner').classList.remove('d-none');
  // Load NER pipeline
  const nerPipeline = await window.transformers.pipeline('ner', 'Xenova/bert-base-NER');
  // Load summarization pipeline
  const summarizer = await window.transformers.pipeline('summarization', 'Xenova/distilbart-cnn-12-6');

  for (let email of emails) {
    // County inference
    let county = "";
    try {
      const nerResults = await nerPipeline(email.body);
      // Find first location entity matching our table
      const places = nerResults.filter(e => e.entity_group === "LOC" || e.entity_group === "ORG")
        .map(e => e.word.replace(/^##/, '').replace(/^[.,\s]+|[.,\s]+$/g, ''));
      for (let place of places) {
        if (placeToCounty[place]) {
          county = placeToCounty[place];
          break;
        }
      }
    } catch (err) {
      county = "";
    }
    email.county = county;

    // Summarization
    try {
      const summaryResult = await summarizer(email.body || email.subject);
      email.summary = summaryResult[0].summary_text;
    } catch (err) {
      email.summary = "";
    }
  }
  document.getElementById('spinner').classList.add('d-none');
  return emails;
}

// File + textarea input logic
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const textInput = document.getElementById('textInput');
  const parseBtn = document.getElementById('parseBtn');
  const output = document.getElementById('output');
  const spinner = document.getElementById('spinner');
  let uploadedText = '';

  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = evt => {
        uploadedText = evt.target.result;
        textInput.value = uploadedText;
      };
      reader.readAsText(file);
    }
  });

  parseBtn.addEventListener('click', async () => {
    output.classList.add('d-none');
    spinner.classList.remove('d-none');
    const text = textInput.value.trim();
    if (!text) {
      output.textContent = 'Please upload a file or paste email text.';
      output.classList.remove('d-none');
      spinner.classList.add('d-none');
      return;
    }
    try {
      const parsed = parseEmails(text);
      const enriched = await enrichEmailsWithAI(parsed);
      const json = JSON.stringify(enriched, null, 2);

      output.textContent = `Parsed ${enriched.length} emails.\n\nSample:\n${json.slice(0, 400)}...`;
      output.classList.remove('d-none');

      // Download JSON
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'parsed_emails.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      output.textContent = 'Error parsing: ' + err;
      output.classList.remove('d-none');
    }
    spinner.classList.add('d-none');
  });
});