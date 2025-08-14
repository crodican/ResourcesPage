// Email data parsing from Outlook export
const emailText = `[EMAIL TEXT WOULD BE INSERTED HERE]`;

function parseEmails(emailText) {
    const emails = [];
    
    // Split by "From:" that appears at the start of a line
    const emailSections = emailText.split(/^From:\s*/m).slice(1);
    
    emailSections.forEach((section, index) => {
        try {
            // Clean up carriage returns and split into lines
            const cleanSection = section.replace(/\r/g, '');
            const lines = cleanSection.split('\n');
            
            // Extract sender from first line
            let senderInfo = lines[0].trim();
            let senderName = "";
            let senderEmail = "";
            
            // Parse sender - check for email format
            if (senderInfo.includes('<') && senderInfo.includes('>')) {
                const emailMatch = senderInfo.match(/<([^>]+)>/);
                senderEmail = emailMatch ? emailMatch[1] : "";
                senderName = senderInfo.split('<')[0].trim();
            } else if (senderInfo.includes('@')) {
                // Direct email format
                senderEmail = senderInfo.trim();
                senderName = senderEmail.split('@')[0];
            } else {
                // Name only - try to find email in the content
                senderName = senderInfo;
                // Look for email patterns in the signature area
                const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
                const foundEmail = section.match(emailPattern);
                if (foundEmail) {
                    senderEmail = foundEmail[1];
                }
            }
            
            // Find Sent and Subject lines
            let dateTime = "";
            let subject = "";
            let bodyStartIndex = -1;
            
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].startsWith('Sent:')) {
                    dateTime = lines[i].replace('Sent:', '').trim();
                } else if (lines[i].startsWith('Subject:')) {
                    subject = lines[i].replace('Subject:', '').trim();
                    // Find where body actually starts
                    for (let j = i + 1; j < lines.length; j++) {
                        if (!lines[j].startsWith('Attachments:') && 
                            !lines[j].trim().startsWith('To:') &&
                            !lines[j].trim().startsWith('Cc:') &&
                            !lines[j].includes('You don\'t often get email') &&
                            !lines[j].includes('CAUTION: This is an External Email') &&
                            lines[j].trim() !== '') {
                            bodyStartIndex = j;
                            break;
                        }
                    }
                    break;
                }
            }
            
            // Extract body content
            let body = "";
            if (bodyStartIndex > 0) {
                const bodyLines = lines.slice(bodyStartIndex);
                let cleanBodyLines = [];
                
                for (let line of bodyLines) {
                    // Stop at common email footers/signatures
                    if (line.includes('From my iPhone') ||
                        line.includes('Sent from my iPhone') ||
                        line.includes('________________________________') ||
                        line.includes('Like us on Facebook:') ||
                        line.includes('www.councilsepa.org') ||
                        line.includes('The information in this email is confidential') ||
                        line.includes('Prevention, Intervention & Addiction Recovery Solutions') ||
                        line.includes('Christopher Rodican, CRS') ||
                        line.includes('Regional Recovery Hubs') ||
                        line.includes('Cell: 267-817-') ||
                        line.includes('Jim Bollinger, CRS') ||
                        line.includes('Program Coordinator') ||
                        line.includes('Philadelphia Recovery Training Center')) {
                        break;
                    }
                    
                    cleanBodyLines.push(line);
                }
                
                body = cleanBodyLines.join(' ').trim();
                body = body.replace(/\s+/g, ' '); // Clean extra whitespace
            }
            
            // Parse date and time
            let date = "";
            let time = "";
            if (dateTime) {
                const dateTimeMatch = dateTime.match(/(\w+,\s+\w+\s+\d+,\s+\d+)\s+(\d+:\d+\s+[AP]M)/);
                if (dateTimeMatch) {
                    const fullDate = new Date(dateTimeMatch[1]);
                    date = `${fullDate.getMonth() + 1}/${fullDate.getDate()}/${fullDate.getFullYear()}`;
                    time = dateTimeMatch[2];
                }
            }
            
            // Infer county from content
            let county = "Unknown";
            const bodyLower = body.toLowerCase();
            const subjectLower = subject.toLowerCase();
            const combinedText = (bodyLower + " " + subjectLower).toLowerCase();
            
            if (combinedText.includes('philadelphia') || combinedText.includes('philly')) {
                county = "Philadelphia";
            } else if (combinedText.includes('bucks county') || senderEmail.includes('buckscounty')) {
                county = "Bucks";
            } else if (combinedText.includes('montgomery county')) {
                county = "Montgomery";
            } else if (combinedText.includes('chester county')) {
                county = "Chester";
            } else if (combinedText.includes('delaware county')) {
                county = "Delaware";
            } else if (combinedText.includes('berks county')) {
                county = "Berks";
            } else if (combinedText.includes('lancaster county')) {
                county = "Lancaster";
            }
            
            // Determine if it's a staff response (from councilsepa.org domain)
            const isStaffResponse = senderEmail.includes('@councilsepa.org') || 
                                  body.includes('crodican@councilsepa.org') ||
                                  body.includes('jbollinger@councilsepa.org') ||
                                  body.includes('adunn@councilsepa.org');
            
            // Determine if it's an inquiry about training
            const inquiryKeywords = [
                'interested in crs', 'interested in training', 'crs training', 
                'recovery specialist training', 'certified recovery specialist',
                'apply for training', 'training program', 'recovery specialist course',
                'interested in becoming', 'crs certification', 'how to get started'
            ];
            const isInquiry = !isStaffResponse && 
                             inquiryKeywords.some(keyword => combinedText.includes(keyword));
            
            // Create summary
            let summary = "";
            if (isInquiry) {
                summary = `${senderName} inquires about CRS training and certification opportunities.`;
            } else if (isStaffResponse) {
                if (combinedText.includes('training') || combinedText.includes('certification')) {
                    summary = `Staff response providing information about CRS training and support services.`;
                } else {
                    summary = `Staff communication regarding recovery programs and events.`;
                }
            } else {
                summary = `Email regarding recovery services and community support.`;
            }
            
            // Only add emails with substantive content
            if (senderName && body.length > 20) {
                emails.push({
                    name: senderName,
                    email: senderEmail,
                    date: date,
                    time: time,
                    subject: subject,
                    body: body.length > 800 ? body.substring(0, 800) + "..." : body,
                    county: county,
                    summary: summary,
                    isInquiry: isInquiry,
                    isStaffResponse: isStaffResponse
                });
            }
            
        } catch (error) {
            console.log(`Error processing email ${index}: ${error.message}`);
        }
    });
    
    return emails;
}

// Example usage:
// const parsedEmails = parseEmails(emailText);
// console.log(`Processed ${parsedEmails.length} emails`);
// console.log(`Inquiries: ${parsedEmails.filter(e => e.isInquiry).length}`);
// console.log(`Staff responses: ${parsedEmails.filter(e => e.isStaffResponse).length}`);