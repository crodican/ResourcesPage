let parsedEmails = [];
let rawEmailText = "";

// Initialize the app
document.addEventListener("DOMContentLoaded", function () {
    setupEventListeners();
});

function setupEventListeners() {
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");

    // Drag and drop functionality
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    dropZone.addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    document.getElementById("parseButton").addEventListener("click", parseEmails);
}

function handleFileUpload(file) {
    if (!file.name.toLowerCase().endsWith(".txt")) {
        alert("Please upload a .txt file");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        rawEmailText = e.target.result;
        showPreview(rawEmailText);
        updateStepIndicator(2);
    };
    reader.readAsText(file);
}

function showPreview(content) {
    document.getElementById("uploadSection").classList.add("d-none");
    document.getElementById("previewSection").classList.remove("d-none");

    const preview = content.substring(0, 2000) + (content.length > 2000 ? "\n\n... (truncated)" : "");
    document.getElementById("emailPreview").textContent = preview;
}

function parseEmails() {
    document.getElementById("previewSection").classList.add("d-none");
    document.getElementById("processingSection").classList.remove("d-none");
    document.querySelector(".loading-spinner").style.display = "inline-block";
    updateStepIndicator(3);

    // Simulate processing with progress
    let progress = 0;
    const progressBar = document.getElementById("progressBar");
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 90) {
            progress = 90;
            clearInterval(progressInterval);
        }
        progressBar.style.width = progress + "%";
    }, 200);

    // Actual parsing (with a slight delay to show progress)
    setTimeout(() => {
        try {
            parsedEmails = parseEmailText(rawEmailText);
            progressBar.style.width = "100%";

            setTimeout(() => {
                showResults();
                updateStepIndicator(4);
            }, 500);
        } catch (error) {
            alert("Error parsing emails: " + error.message);
            resetApp();
        }
    }, 1000);
}

function parseEmailText(emailText) {
    const emails = [];

    // Split by "From:" that appears at the start of a line
    const emailSections = emailText.split(/^From:\s*/m).slice(1);

    emailSections.forEach((section, index) => {
        try {
            // Clean up carriage returns and split into lines
            const cleanSection = section.replace(/\r/g, "");
            const lines = cleanSection.split("\n");

            // Extract sender from first line
            let senderInfo = lines[0].trim();
            let senderName = "";
            let senderEmail = "";

            // Parse sender - check for email format
            if (senderInfo.includes("<") && senderInfo.includes(">")) {
                const emailMatch = senderInfo.match(/<([^>]+)>/);
                senderEmail = emailMatch ? emailMatch[1] : "";
                senderName = senderInfo.split("<")[0].trim();
            } else if (senderInfo.includes("@")) {
                // Direct email format
                senderEmail = senderInfo.trim();
                senderName = senderEmail.split("@")[0];
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
                if (lines[i].startsWith("Sent:")) {
                    dateTime = lines[i].replace("Sent:", "").trim();
                } else if (lines[i].startsWith("Subject:")) {
                    subject = lines[i].replace("Subject:", "").trim();
                    // Find where body actually starts
                    for (let j = i + 1; j < lines.length; j++) {
                        if (
                            !lines[j].startsWith("Attachments:") &&
                            !lines[j].trim().startsWith("To:") &&
                            !lines[j].trim().startsWith("Cc:") &&
                            !lines[j].includes("You don't often get email") &&
                            !lines[j].includes("CAUTION: This is an External Email") &&
                            lines[j].trim() !== ""
                        ) {
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
                    if (
                        line.includes("From my iPhone") ||
                        line.includes("Sent from my iPhone") ||
                        line.includes("________________________________") ||
                        line.includes("Like us on Facebook:") ||
                        line.includes("www.councilsepa.org") ||
                        line.includes("The information in this email is confidential") ||
                        line.includes("Prevention, Intervention & Addiction Recovery Solutions") ||
                        line.includes("Christopher Rodican, CRS") ||
                        line.includes("Regional Recovery Hubs") ||
                        line.includes("Cell: 267-817-") ||
                        line.includes("Jim Bollinger, CRS") ||
                        line.includes("Program Coordinator") ||
                        line.includes("Philadelphia Recovery Training Center")
                    ) {
                        break;
                    }

                    cleanBodyLines.push(line);
                }

                body = cleanBodyLines.join(" ").trim();
                body = body.replace(/\s+/g, " "); // Clean extra whitespace
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
            let county = inferCounty(body, subject, senderEmail);

            // Determine if it's a staff response
            const isStaffResponse =
                senderEmail.includes("@councilsepa.org") ||
                body.includes("crodican@councilsepa.org") ||
                body.includes("jbollinger@councilsepa.org") ||
                body.includes("adunn@councilsepa.org");

            // Determine if it's an inquiry about training
            const isInquiry = determineIfInquiry(body, subject, isStaffResponse);

            // Generate AI summary
            const summary = generateAISummary(body, subject, isInquiry, isStaffResponse, senderName);

            // Only add emails with substantive content
            if (senderName && body.length > 20) {
                emails.push({
                    name: senderName,
                    email: senderEmail,
                    date: date,
                    time: time,
                    subject: subject,
                    body: body,
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

function inferCounty(body, subject, senderEmail) {
    const bodyLower = body.toLowerCase();
    const subjectLower = subject.toLowerCase();
    const combinedText = (bodyLower + " " + subjectLower).toLowerCase();

    if (combinedText.includes("philadelphia") || combinedText.includes("philly")) {
        return "Philadelphia";
    } else if (combinedText.includes("bucks county") || senderEmail.includes("buckscounty")) {
        return "Bucks";
    } else if (combinedText.includes("montgomery county")) {
        return "Montgomery";
    } else if (combinedText.includes("chester county")) {
        return "Chester";
    } else if (combinedText.includes("delaware county")) {
        return "Delaware";
    } else if (combinedText.includes("berks county")) {
        return "Berks";
    } else if (combinedText.includes("lancaster county")) {
        return "Lancaster";
    } else if (combinedText.includes("schuylkill county")) {
        return "Schuylkill";
    } else {
        return "Unknown";
    }
}

function determineIfInquiry(body, subject, isStaffResponse) {
    if (isStaffResponse) return false;

    const combinedText = (body + " " + subject).toLowerCase();
    const inquiryKeywords = [
        "interested in crs",
        "interested in training",
        "crs training",
        "recovery specialist training",
        "certified recovery specialist",
        "apply for training",
        "training program",
        "recovery specialist course",
        "interested in becoming",
        "crs certification",
        "how to get started",
        "training information",
        "how do i",
        "want to learn",
        "looking for training"
    ];

    return inquiryKeywords.some((keyword) => combinedText.includes(keyword));
}

function generateAISummary(body, subject, isInquiry, isStaffResponse, senderName) {
    if (isInquiry) {
        return `${senderName} inquires about CRS training and certification opportunities.`;
    } else if (isStaffResponse) {
        if (body.toLowerCase().includes("training") || body.toLowerCase().includes("certification")) {
            return `Staff response providing information about CRS training and support services.`;
        } else {
            return `Staff communication regarding recovery programs and events.`;
        }
    } else {
        return `Email regarding recovery services and community support from ${senderName}.`;
    }
}

function showResults() {
    document.getElementById("processingSection").classList.add("d-none");
    document.getElementById("resultsSection").classList.remove("d-none");

    // Update statistics
    const totalParsed = parsedEmails.length;
    const totalInquiries = parsedEmails.filter((e) => e.isInquiry).length;
    const totalStaffResponses = parsedEmails.filter((e) => e.isStaffResponse).length;
    const counties = new Set(parsedEmails.map((e) => e.county).filter((c) => c !== "Unknown"));
    const totalCounties = counties.size;

    document.getElementById("totalParsed").textContent = totalParsed;
    document.getElementById("totalInquiries").textContent = totalInquiries;
    document.getElementById("totalStaffResponses").textContent = totalStaffResponses;
    document.getElementById("totalCounties").textContent = totalCounties;

    // Show county distribution
    showCountyDistribution();
}

function showCountyDistribution() {
    const countyCounts = {};
    parsedEmails.forEach((email) => {
        const county = email.county || "Unknown";
        countyCounts[county] = (countyCounts[county] || 0) + 1;
    });

    const distributionDiv = document.getElementById("countyDistribution");
    let html = "";

    Object.entries(countyCounts).forEach(([county, count]) => {
        const percentage = ((count / parsedEmails.length) * 100).toFixed(1);
        html += `
                    <span class="county-badge county-${county.toLowerCase()} me-2 mb-2 d-inline-block">
                        ${county}: ${count} (${percentage}%)
                    </span>
                `;
    });

    distributionDiv.innerHTML = html;
}

function showParsedEmails() {
    document.getElementById("emailsDisplaySection").classList.remove("d-none");

    let html = "";
    parsedEmails.forEach((email, index) => {
        html += `
                    <div class="card mb-3">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${escapeHtml(email.name)}</strong>
                                <span class="text-muted">(${escapeHtml(email.email)})</span>
                            </div>
                            <div>
                                <span class="county-badge county-${email.county.toLowerCase()}">${email.county}</span>
                                ${email.isInquiry ? '<span class="badge bg-success ms-1">Inquiry</span>' : ""}
                                ${email.isStaffResponse ? '<span class="badge bg-primary ms-1">Staff</span>' : ""}
                            </div>
                        </div>
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">${email.date} ${email.time}</h6>
                            <h6 class="card-title">${escapeHtml(email.subject)}</h6>
                            <p class="card-text"><strong>Summary:</strong> ${escapeHtml(email.summary)}</p>
                            <details>
                                <summary class="btn btn-sm btn-outline-secondary">View Email Body</summary>
                                <div class="mt-2 p-3 bg-light border rounded">
                                    <pre style="white-space: pre-wrap; font-size: 0.9em;">${escapeHtml(email.body)}</pre>
                                </div>
                            </details>
                        </div>
                    </div>
                `;
    });

    document.getElementById("parsedEmailsList").innerHTML = html;
    document.getElementById("jsonSection").classList.remove("d-none");
    document.getElementById("jsonOutput").textContent = JSON.stringify(parsedEmails, null, 2);
}

function downloadJSON() {
    const dataStr = JSON.stringify(parsedEmails, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "parsed_emails.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function copyJSON() {
    const jsonText = JSON.stringify(parsedEmails, null, 2);
    navigator.clipboard
        .writeText(jsonText)
        .then(() => {
            alert("JSON copied to clipboard!");
        })
        .catch((err) => {
            console.error("Failed to copy: ", err);
        });
}

function updateStepIndicator(currentStep) {
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step${i}`);
        step.className = "step-indicator ";

        if (i < currentStep) {
            step.className += "step-completed";
        } else if (i === currentStep) {
            step.className += "step-active";
        } else {
            step.className += "step-pending";
        }
    }
}

function resetApp() {
    // Reset all sections
    document.getElementById("uploadSection").classList.remove("d-none");
    document.getElementById("previewSection").classList.add("d-none");
    document.getElementById("processingSection").classList.add("d-none");
    document.getElementById("resultsSection").classList.add("d-none");
    document.getElementById("emailsDisplaySection").classList.add("d-none");
    document.getElementById("jsonSection").classList.add("d-none");

    // Reset variables
    parsedEmails = [];
    rawEmailText = "";

    // Reset file input
    document.getElementById("fileInput").value = "";

    // Reset progress
    updateStepIndicator(1);
    document.getElementById("progressBar").style.width = "0%";
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
