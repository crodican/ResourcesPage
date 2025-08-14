# Outlook Email Export Parser with AI County & Summary

A browser-based app for parsing exported Outlook emails, inferring Pennsylvania counties, and generating summaries—**all client-side, with no server or API keys required!**

## Features

- **Upload .txt file** or paste exported email text from Outlook.
- **Parse emails** to extract sender, subject, date, time, and body.
- **County inference:** Uses AI (Named Entity Recognition) to find place names and matches them to counties via a live [PA cities/counties CSV](https://resourcespage.pages.dev/pa_cities_counties.csv).
- **AI-powered summarization:** Uses a local model (via [transformers.js](https://xenova.github.io/transformers.js/)) for concise, readable summaries.
- **Download JSON**: Save results to your computer for further analysis.
- **No backend/server:** All processing is done in your browser for privacy and zero cost.

## How It Works

1. **Upload or paste** your exported Outlook email text.
2. Click **Parse & Download JSON**.
3. The app:
   - Parses each email block.
   - Runs AI models in-browser for county and summary.
   - Looks up county using the latest PA cities/counties CSV.
   - Gives you a downloadable JSON file with all results.

## Technologies Used

- [Bootstrap 5.3](https://getbootstrap.com/) for UI.
- [transformers.js](https://xenova.github.io/transformers.js/) for in-browser AI (NER and summarization).
- [PA Cities/Counties CSV](https://resourcespage.pages.dev/pa_cities_counties.csv) for mapping place names to counties.
- Pure JavaScript—no server, no accounts, no keys.

## File Structure

- `index.html` — Main UI page.
- `parse.js` — Core logic, including CSV loading, email parsing, AI-powered enrichment.
- `README.md` — This file.

## Sample Output

Each parsed email object looks like:

```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "date": "April 1, 2025",
  "time": "3:01 PM",
  "subject": "DBHIDS Certified Peer Specialist Training",
  "body": "...",
  "county": "Philadelphia",
  "summary": "This email contains information about peer specialist training opportunities.",
   "isInquiry": false,
   "isStaffResponse": false
}
```

## Notes & Limitations

- **First use:** AI models are loaded in-browser; initial load may take 30-60 seconds.
- **Accuracy:** County detection depends on place names found and CSV mapping; ambiguous cases may be missed.
- **Privacy:** All processing is local to your browser—your emails are never sent to any server.
- **CSV updates:** The app always uses the latest CSV from the provided URL; you can fork and modify this source if needed.

## Contributing

- Fork, improve, and submit pull requests!
- Suggestions, spelling fixes, and county mapping improvements welcome.

## License

GNU GPL 2.0

## Credits

- [xenova/transformers.js](https://github.com/xenova/transformers.js)
- [Bootstrap](https://getbootstrap.com/)
- PA cities/counties data: [resourcespage.pages.dev](https://resourcespage.pages.dev/pa_cities_counties.csv)