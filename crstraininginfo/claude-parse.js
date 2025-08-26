// COMPLETE EMAIL PROCESSING TOOLKIT
// For converting Outlook email exports to JSON format
// Usage: Run this script in Claude's analysis tool with uploaded email file

async function processEmailsToJSON(filename = 'output_march.txt') {
    try {
        // 1. READ AND SPLIT EMAILS
        const fileContent = await window.fs.readFile(filename, { encoding: 'utf8' });
        const emailSections = fileContent.split(/(?=^From:\s)/m).filter(section => section.trim().length > 0);
        console.log(`Found ${emailSections.length} email sections`);

        // 2. HELPER FUNCTIONS
        function extractNameAndEmail(fromLine) {
            // Handle: "From: Name <email>" or "From: Name email" or "From: email"
            const match1 = fromLine.match(/From:\s*([^<]+?)\s*<([^>]+)>/);
            if (match1) {
                return {
                    name: match1[1].trim().replace(/\t/g, ''),
                    email: match1[2].trim()
                };
            }
            
            const match2 = fromLine.match(/From:\s*([^\s]+@[^\s]+)/);
            if (match2) {
                return {
                    name: match2[1].split('@')[0],
                    email: match2[1].trim()
                };
            }
            
            const match3 = fromLine.match(/From:\s*(.+?)\s+([^\s]+@[^\s]+)/);
            if (match3) {
                return {
                    name: match3[1].trim().replace(/\t/g, ''),
                    email: match3[2].trim()
                };
            }
            
            const match4 = fromLine.match(/From:\s*([^<\n]+)/);
            if (match4) {
                return {
                    name: match4[1].trim().replace(/\t/g, ''),
                    email: 'unknown'
                };
            }
            
            return { name: 'Unknown', email: 'unknown' };
        }

        function parseDateAndTime(sentLine) {
            // Extract from "Sent: Tuesday, March 4, 2025 8:43 PM"
            const match = sentLine.match(/Sent:\s*.*?(\w+,\s*\w+\s+\d{1,2},\s*\d{4})\s+(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
            
            if (match) {
                const dateObj = new Date(match[1]);
                if (!isNaN(dateObj)) {
                    const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;
                    return { date: dateStr, time: match[2] };
                }
            }
            
            return { date: 'Unknown', time: 'Unknown' };
        }

        function extractSubject(subjectLine) {
            const match = subjectLine.match(/Subject:\s*(.+)/);
            return match ? match[1].trim() : 'No Subject';
        }

        function detectCounty(content) {
            const text = content.toLowerCase();
            
            // Add your specific county mappings here
            if (text.includes('philadelphia') || text.includes('philly')) return 'Philadelphia';
            if (text.includes('bucks')) return 'Bucks';
            if (text.includes('chester')) return 'Chester';
            if (text.includes('montgomery')) return 'Montgomery';
            if (text.includes('delaware')) return 'Delaware';
            if (text.includes('levittown')) return 'Bucks';
            if (text.includes('bristol')) return 'Bucks';
            if (text.includes('allentown')) return 'Lehigh';
            if (text.includes('reading')) return 'Berks';
            if (text.includes('norristown')) return 'Montgomery';
            if (text.includes('exton')) return 'Chester';
            if (text.includes('narberth')) return 'Montgomery';
            
            return 'Unknown';
        }

        function isStaffEmail(email, name) {
            const lowerEmail = email.toLowerCase();
            const lowerName = name.toLowerCase();
            
            // Update these with your organization's staff identifiers
            return lowerEmail.includes('@councilsepa.org') || 
                   lowerName.includes('christopher rodican') ||
                   lowerName.includes('jim bollinger') ||
                   lowerName.includes('alison dunn') ||
                   lowerName.includes('melissa groden');
        }

        function cleanEmailBody(content) {
            let body = content;
            
            // Remove headers
            body = body.replace(/^From:.*?\n/m, '');
            body = body.replace(/^Sent:.*?\n/m, '');
            body = body.replace(/^To:.*?\n/m, '');
            body = body.replace(/^Cc:.*?\n/m, '');
            body = body.replace(/^Subject:.*?\n/m, '');
            body = body.replace(/^Attachments:.*?\n/m, '');
            
            // Remove caution warnings and disclaimers
            body = body.replace(/CAUTION: This is an External Email.*?\n\n?/gs, '');
            body = body.replace(/You don't often get email from.*?\n/g, '');
            body = body.replace(/Learn why this is important.*?\n/g, '');
            body = body.replace(/\[You don't often get email from.*?\]/g, '');
            
            // Remove common email signatures and disclaimers
            body = body.replace(/The information contained in this transmission.*$/s, '');
            body = body.replace(/This e-mail message.*?from your system\..*$/s, '');
            body = body.replace(/Make your donation.*$/s, '');
            body = body.replace(/United Way Donor Choice.*$/s, '');
            body = body.replace(/Find us on the Web.*$/s, '');
            body = body.replace(/Like us on Facebook.*$/s, '');
            body = body.replace(/Prevention, Intervention & Addiction Recovery Solutions.*$/s, '');
            body = body.replace(/\*\*[\s\S]*$/m, '');
            body = body.replace(/--[\s\S]*$/m, '');
            
            // Clean up formatting
            body = body.replace(/\r\n/g, '\n');
            body = body.replace(/\n{3,}/g, '\n\n');
            body = body.trim();
            
            // Truncate to specified length (adjust as needed)
            if (body.length > 400) {
                body = body.substring(0, 400) + '...';
            }
            
            return body;
        }

        function generateSummary(content, isStaff, subject) {
            const lowerContent = content.toLowerCase();
            const lowerSubject = subject.toLowerCase();
            
            if (isStaff) {
                // Staff response patterns - customize these for your organization
                if (lowerContent.includes('practice test') || lowerContent.includes('exam prep')) {
                    return 'Staff provides exam practice materials to student';
                } else if (lowerContent.includes('scholarship') || lowerContent.includes('funding')) {
                    return 'Staff responds to scholarship funding inquiry';
                } else if (lowerContent.includes('technical tuesday')) {
                    return 'Staff sends Technical Tuesday training announcement';
                } else if (lowerContent.includes('make up') || lowerContent.includes('missed class')) {
                    return 'Staff coordinates make-up class information';
                } else if (lowerSubject.includes('test')) {
                    return 'Staff testing automated systems';
                } else if (lowerContent.includes('zoom') || lowerContent.includes('meeting')) {
                    return 'Staff coordinates virtual meeting or training';
                } else if (lowerContent.includes('crss') || lowerContent.includes('supervisor')) {
                    return 'Staff announces supervisor training program';
                } else {
                    return 'Staff provides CRS training information and support';
                }
            } else {
                // Public inquiry patterns - customize these for your use case
                if (lowerContent.includes('cfrs')) {
                    return 'Individual inquires about CFRS (family recovery specialist) training';
                } else if (lowerContent.includes('scholarship') || lowerContent.includes('funding')) {
                    return 'Organization requests scholarship information for client';
                } else if (lowerContent.includes('make up') || lowerContent.includes('missed')) {
                    return 'Student requests information about making up missed classes';
                } else if (lowerContent.includes('recovery') && lowerContent.includes('years')) {
                    return 'Individual shares recovery story and training interest';
                } else if (lowerContent.includes('interested') && lowerContent.includes('crs')) {
                    return 'Individual expresses interest in CRS certification training';
                } else if (lowerContent.includes('training class')) {
                    return 'Individual requests training class information';
                } else {
                    return 'Individual inquires about recovery specialist training';
                }
            }
        }

        // 3. PROCESS ALL EMAILS
        const emailData = [];

        for (let i = 0; i < emailSections.length; i++) {
            const emailText = emailSections[i];
            const lines = emailText.split(/\r?\n/);
            
            // Extract header lines
            let fromLine = '', sentLine = '', subjectLine = '';
            
            for (let j = 0; j < Math.min(10, lines.length); j++) {
                if (lines[j].startsWith('From:')) fromLine = lines[j];
                else if (lines[j].startsWith('Sent:')) sentLine = lines[j];
                else if (lines[j].startsWith('Subject:')) subjectLine = lines[j];
            }
            
            // Skip if missing essential info
            if (!fromLine || !sentLine) continue;
            
            // Extract all information
            const nameEmail = extractNameAndEmail(fromLine);
            const dateTime = parseDateAndTime(sentLine);
            const subject = extractSubject(subjectLine);
            const isStaff = isStaffEmail(nameEmail.email, nameEmail.name);
            const county = detectCounty(emailText);
            const bodyContent = cleanEmailBody(emailText);
            const summary = generateSummary(emailText, isStaff, subject);
            
            // Create email object
            emailData.push({
                name: nameEmail.name,
                email: nameEmail.email,
                date: dateTime.date,
                time: dateTime.time,
                county: county,
                subject: subject,
                body: bodyContent,
                summary: summary,
                isInquiry: !isStaff,
                isStaffResponse: isStaff
            });
        }

        // 4. GENERATE OUTPUT
        const jsOutput = `emailData = ${JSON.stringify(emailData, null, 4)};`;
        
        // 5. RETURN RESULTS
        console.log(`✅ Successfully processed ${emailData.length} emails`);
        console.log(`📊 Breakdown: ${emailData.filter(e => e.isInquiry).length} inquiries, ${emailData.filter(e => e.isStaffResponse).length} staff responses`);
        
        // Store results globally for access
        window.processedEmails = emailData;
        window.finalJSONOutput = jsOutput;
        
        return {
            emails: emailData,
            jsonOutput: jsOutput,
            stats: {
                total: emailData.length,
                inquiries: emailData.filter(e => e.isInquiry).length,
                staffResponses: emailData.filter(e => e.isStaffResponse).length,
                unknownEmails: emailData.filter(e => e.email === 'unknown').length
            }
        };
        
    } catch (error) {
        console.error('❌ Error processing emails:', error);
        throw error;
    }
}

// USAGE INSTRUCTIONS:
/*
1. Upload your email file to Claude
2. Run: const result = await processEmailsToJSON('your_filename.txt');
3. Access results:
   - result.emails (array of email objects)
   - result.jsonOutput (complete JavaScript code)
   - result.stats (processing statistics)

CUSTOMIZATION POINTS:
- Update detectCounty() with your geographic areas
- Update isStaffEmail() with your organization's identifiers
- Update generateSummary() with your specific email patterns
- Adjust cleanEmailBody() signature removal patterns
- Modify body truncation length in cleanEmailBody()

FUTURE EFFICIENCY TIPS:
- Keep this script saved for reuse
- Only update the customization functions as needed
- For large files, consider processing in batches
- Test with a small sample first to verify accuracy
*/

// Run the processor (uncomment to execute)
// const result = await processEmailsToJSON('output_march.txt');