# Hub Resources Application

The Hub Resources Application is a web application that allows users to search, filter, and sort through various Recovery resources in Regions 1 and 4 efficiently. It leverages a backend API powered by NocoDB to provide flexible querying and dynamic filtering capabilities.


This Cloudflare Worker acts as a proxy to your NocoDB database, providing a flexible API endpoint for fetching and filtering data from a specific NocoDB table. It handles pagination, sorting, filtering, and even distance-based sorting based on user location.

## Setup

### Prerequisites

* A NocoDB database instance.
* A Cloudflare Workers account.
* `wrangler` CLI tool installed and configured for your Cloudflare account.

### Configuration

1.  **Set the `NOCODB_API_TOKEN` Secret:**
    * This worker requires your NocoDB API token to authenticate with your database.
    * **Via Cloudflare Dashboard:** Navigate to your Worker's **Settings** tab, then **Variables**, and under **Environment Variables**, click **Add & Encrypt**. Set the **Name** to `NOCODB_API_TOKEN` and the **Value** to your NocoDB API token.
    * **Via `wrangler` CLI:** Open your terminal in the Worker's project directory and run:
        ```bash
        wrangler secret put NOCODB_API_TOKEN
        ```
        You will be prompted to enter the secret value.

2.  **Update `baseNocoDbUrl`:**
    * In the `handleRequest` function, locate the line:
        ```javascript
        const baseNocoDbUrl = `https://app.nocodb.com/api/v2/tables/mu8v5qw718w8hkd/records`;
        ```
    * Replace `https://app.nocodb.com/api/v2/tables/mu8v5qw718w8hkd/records` with the correct base URL for your NocoDB table's records endpoint. You can find this in your NocoDB interface. The format is typically `https://<your-nocodb-domain>/api/v2/tables/<your-table-id>/records`.

3.  **Optional: Update `viewId` Default:**
    * The `viewId` parameter defaults to `'vwr1w8nwoolz254r'`. If you want to use a specific NocoDB view by default, update this value in the `handleRequest` function:
        ```javascript
        const viewId = url.searchParams.get('viewId') || 'YOUR_DEFAULT_VIEW_ID';
        ```

4.  **Optional: Adjust Search Fields:**
    * The `constructWhereClause` function includes a search functionality that looks across specific fields: `'Location Name'`, `'Organization'`, and `'Category'`. Modify the `searchFields` array to match the columns in your NocoDB table you want to include in the global search:
        ```javascript
        const searchFields = ['Location Name', 'Organization', 'Category', 'Your Other Field'];
        ```

5.  **Deploy the Worker:**
    * Once you have configured the necessary settings, deploy your Cloudflare Worker using the `wrangler publish` command in your terminal.

## API Usage

You can access the data through your deployed Cloudflare Worker URL. The following query parameters are supported:

### Basic Parameters

* `page`: (Optional, integer, default: `1`) The page number for pagination.
* `limit`: (Optional, integer, default: `25`) The number of records to return per page.
* `sort`: (Optional, string) Specifies the field(s) to sort by. Prefix a field name with `-` for descending order (e.g., `sort=Name,-Date`). Ensure the field names match your NocoDB column names exactly.
* `fields`: (Optional, string) A comma-separated list of field names to include in the response. This can help reduce the data transferred.
* `recordId`: (Optional, string) If provided, fetches a single record with the specified ID. All other filtering and pagination parameters are ignored.
* `count`: (Optional, integer, value: `1`) If set to `1`, only returns the total count of records matching the applied filters. No actual record data is returned.
* `viewId`: (Optional, string) The ID of a specific NocoDB view to use for fetching data. If not provided, the default view ID (configured in the worker) will be used.

### Filtering Parameters

You can filter data based on specific column values. The parameter names correspond to your NocoDB column names.

* `County`: Filter by one or more county names. Multiple values can be provided by repeating the parameter (e.g., `?County=Berks&County=Bucks`) or as a comma-separated string (e.g., `?County=Berks,Bucks`).
* `Populations`: (Assuming your NocoDB column is named 'Populations Served') Filter by populations served. Supports multiple values similar to `County`. Uses a `like` operator for partial matches.
* `Resource Type`: Filter by one or more resource types. Supports multiple values similar to `County`.
* `Category`: Filter by one or more categories. Supports multiple values similar to `County`.
* `search`: (Optional, string) A general search term that will look for matches in the `'Location Name'`, `'Organization'`, and `'Category'` columns (configurable in the worker).

### Distance Sorting Parameters

You can sort resources based on their distance from a given latitude and longitude.

* `userLat`: (Required for distance sort, float) The user's latitude.
* `userLon`: (Required for distance sort, float) The user's longitude.
* `sort`: (Required for distance sort, string, value: `distance`) Set the `sort` parameter to `distance` to enable distance-based sorting.

**Important Note on Distance Sorting:** Due to limitations in NocoDB's sorting capabilities with dynamic calculations, distance sorting is handled within the Cloudflare Worker. This means:

* The worker fetches a limited number of records (currently 1000) that match the filters.
* The distance is calculated for each fetched record.
* The records are then sorted by distance within the worker.
* Pagination is applied to the sorted results.
* The `totalRows` in the `pageInfo` for distance-sorted results reflects the number of records fetched for distance calculation (up to the limit), not the absolute total number of filtered resources. For an accurate total count with distance filtering, a separate count query (without distance parameters) would be needed.

## Examples

### Fetching the first page of resources (default limit of 25):
https://resourcesdatabaseproxy.crodican.workers.dev/


### Fetching page 3 with a limit of 10:

https://resourcesdatabaseproxy.crodican.workers.dev/?page=3&amp;limit=10


### Sorting resources by name in ascending order:

https://resourcesdatabaseproxy.crodican.workers.dev/?sort=Location Name


### Sorting resources by date in descending order and then by name in ascending order:

https://resourcesdatabaseproxy.crodican.workers.dev/?sort=-Date,Location Name


### Filtering resources in "Berks" and "Bucks" counties:

https://resourcesdatabaseproxy.crodican.workers.dev/?County=Berks&amp;County=Bucks


### Filtering resources with a "Warm Handoff" category:

https://resourcesdatabaseproxy.crodican.workers.dev/?Category=Warm%20Handoff


### Fetching only the "Location Name" and "Organization" fields:

https://resourcesdatabaseproxy.crodican.workers.dev/?fields=Location Name,Organization


### Fetching a single record with ID "rec1234567890":

https://resourcesdatabaseproxy.crodican.workers.dev/?recordId=rec1234567890


### Getting the total count of resources in "Philadelphia" county:

https://resourcesdatabaseproxy.crodican.workers.dev/?County=Philadelphia&amp;count=1


### Fetching resources sorted by distance from latitude 40.0 and longitude -75.0:

https://resourcesdatabaseproxy.crodican.workers.dev/?userLat=40.0&amp;userLon=-75.0&amp;sort=distance


### Fetching the second page of resources sorted by distance:

https://resourcesdatabaseproxy.crodican.workers.dev/?userLat=40.0&amp;userLon=-75.0&amp;sort=distance&amp;page=2&amp;limit=15


### Filtering by county and searching for "clinic":

https://resourcesdatabaseproxy.crodican.workers.dev/?County=Montgomery&amp;search=clinic


## Response Format

The API generally returns a JSON object with the following structure (unless `count=1` or `recordId` is used):

```json
{
  "list": [
    {
      "id": "recxxxxxxxxxxxxxxx",
      "fields": {
        "Location Name": "...",
        "Organization": "...",
        "Category": "...",
        // ... other fields based on your NocoDB table and the 'fields' parameter
        "Latitude": 40.0,
        "Longitude": -75.0,
        "distance": 12.34 // Only present when distance sorting is applied
      },
      "createdAt": "2023-10-27T10:00:00.000Z",
      "updatedAt": "2023-10-27T10:30:00.000Z"
    },
    // ... more records
  ],
  "pageInfo": {
    "totalRows": 150,
    "isFirstPage": true,
    "isLastPage": false,
    "currentPage": 1,
    "pageSize": 25
  }
}

```

When fetching a single record (recordId is provided), the response will be a single JSON object representing that record:

### JSON
```
{
  "id": "recxxxxxxxxxxxxxxx",
  "fields": {
    "Location Name": "...",
    "Organization": "...",
    // ... all fields for the record
    "Latitude": 40.0,
    "Longitude": -75.0
  },
  "createdAt": "2023-10-27T10:00:00.000Z",
  "updatedAt": "2023-10-27T10:30:00.000Z"
}
```

When requesting a count (count=1), the response will be:

### JSON
```
{
  "count": 78
}
```

## CORS Headers
The worker includes basic CORS headers (Access-Control-Allow-Origin: '*', Access-Control-Allow-Methods: 'GET, OPTIONS', Access-Control-Allow-Headers: '*'). You may want to adjust these in production for better security by specifying allowed origins and headers.



