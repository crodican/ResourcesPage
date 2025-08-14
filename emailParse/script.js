// Improved browser-compatible parser

function parseEmails(emailText) {
  // Split emails by "From:"
  const emails = emailText.split(/^From:\s*/m).filter(block => block.trim());
  const parsed = [];

  emails.forEach(raw => {
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let name = '', email = '', date = '', time = '', subject = '';
    let bodyLines = [];
    let isStaffResponse = false, isInquiry = false, county = '', summary = '';

    // Find sender line
    if (lines[0]) {
      const senderMatch = lines[0].match(/(.*?)<([^>]+)>/);
      if (senderMatch) {
        name = senderMatch[1].trim();
        email = senderMatch[2].trim();
      } else {
        name = lines[0];
      }
    }

    // Find subject, date/time
    for (let i = 1; i < lines.length; i++) {
      if (!subject && lines[i].startsWith('Subject:')) {
        subject = lines[i].replace(/Subject:\s*/, '');
        continue;
      }
      if (!date && lines[i].match(/^[A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}/)) {
        // Looks like "Tuesday, April 1, 2025 3:01 PM"
        const dtMatch = lines[i].match(/^([A-Za-z]+),\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\s+([0-9:APM ]+)$/);
        if (dtMatch) {
          date = `${dtMatch[2]} ${dtMatch[3]}, ${dtMatch[4]}`;
          time = dtMatch[5].trim();
        }
        continue;
      }
      // Ignore Outlook notices and signatures
      if (
        lines[i].startsWith('You don\'t often get email') ||
        lines[i].includes('CAUTION: This is an External Email') ||
        lines[i].startsWith('---') ||
        lines[i].startsWith('Sent from my iPhone') ||
        lines[i].startsWith('CONFIDENTIALITY NOTICE')
      ) {
        continue;
      }
      // Find first line after subject that's not metadata
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

    // Infer county
    const countyMatch = body.match(/\b(Bucks|Montgomery|Philadelphia|Chester|Delaware)\b/i);
    county = countyMatch ? countyMatch[1] : '';

    // Heuristics for inquiry/staff
    isInquiry = /training|register|how do i|how can i|info|information|am i eligible|can i/i.test(body + subject);
    isStaffResponse = /thank you|attached|please see|let me know|contact|post in your organization|forward/i.test(body + subject);

    summary = isInquiry
      ? "Inquiry about training or program."
      : isStaffResponse
        ? "Staff communication regarding programs or events."
        : "";

    parsed.push({
      name, email, date, time, subject, body, county, summary, isInquiry, isStaffResponse
    });
  });
  return parsed;
}

// File + textarea input logic
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const textInput = document.getElementById('textInput');
  const parseBtn = document.getElementById('parseBtn');
  const output = document.getElementById('output');

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

  parseBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (!text) {
      output.textContent = 'Please upload a file or paste email text.';
      return;
    }
    try {
      const parsed = parseEmails(text);
      const json = JSON.stringify(parsed, null, 2);

      // Show summary for user
      output.textContent = `Parsed ${parsed.length} emails.\n\nSample:\n${json.slice(0, 400)}...`;

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
    }
  });
});