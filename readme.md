# NocoDB API Proxy Worker

A Cloudflare Worker that acts as a proxy API endpoint for a NocoDB database, offering enhanced filtering, sorting, and search capabilities.

## Overview

This worker serves as a customizable API layer between your frontend application and a NocoDB database. It efficiently handles complex queries, pagination, and specific sorting requirements while ensuring the security of your NocoDB API token.

## Features

* ✅ **Filtering:** Filter records based on multiple criteria.
* 🔍 **Full-text Search:** Perform searches across multiple fields.
* 📄 **Pagination:** Implement page-based navigation of results.
* 🧭 **Distance-Based Sorting (In Development):** Special handling for sorting records by distance.
* 🔐 **Secure Token Management:** Keeps your NocoDB API token confidential.
* 🌐 **CORS Support:** Enables access from browser clients.

## Architecture

Frontend ↔ Cloudflare Worker ↔ NocoDB API


## API Parameters

The following parameters can be used to query the API:

| Parameter     | Description                                    | Example                       |
|---------------|------------------------------------------------|-------------------------------|
| `page`        | Page number (1-based)                          | `?page=2`                     |
| `limit`       | Number of records per page                     | `?limit=50`                    |
| `sort`        | Field to sort by                               | `?sort=distance`               |
| `fields`      | Comma-separated fields to return               | `?fields=ID,Name`              |
| `recordId`    | Specific record ID to retrieve                | `?recordId=123`                |
| `County`      | Filter by county (multiple allowed)          | `?County=Los Angeles`          |
| `Populations` | Filter by population served                   | `?Populations=Seniors`        |
| `Resource Type`| Filter by resource type                      | `?Resource Type=Healthcare`    |
| `Category`    | Filter by category                             | `?Category=Medical`            |
| `search`      | Full-text search term                          | `?search=hospital`             |
| `userLat`     | User latitude for distance sort              | `?userLat=34.0522`             |
| `userLon`     | User longitude for distance sort             | `?userLon=-118.2437`            |

## Response Format

### Standard Response

```json
{
  "list": [...],
  "pageInfo": {
    "totalRows": 100,
    "currentPage": 1,
    "pageSize": 25
  }
}
Distance Sort Response (In Development)
JSON

{
  "list": [...],
  "pageInfo": {...},
  "distanceSorted": true
}
```

## Security

- API tokens are securely stored in environment variables.
- CORS headers allow any origin (should be restricted in production).
- Basic input validation is implemented to prevent common injection attacks.

## Monitoring

Utilize the Cloudflare dashboard to track:

- Request rates
- Error rates
- Response times
- Bandwidth usage

## API Usage
Access data via your deployed Cloudflare Worker URL. The following query parameters are supported:

### Basic Parameters

- page (Optional, integer, default: 1): The page number for pagination.
- limit (Optional, integer, default: 25): The number of records to return per page.
- sort (Optional, string): Specifies the field(s) to sort by. Use a - prefix for descending order (e.g., sort=Name,-Date). Ensure field names match your NocoDB column names.
- fields (Optional, string): A comma-separated list of field names to include in the response.
- recordId (Optional, string): If provided, fetches a single record with the specified ID, ignoring other filtering and pagination parameters.
- count (Optional, integer, value: 1): If set to 1, returns only the total count of records matching the filters, without the actual data.
- viewId (Optional, string): The ID of a specific NocoDB view to use. Defaults to the configured view ID in the worker.

### Filtering Parameters
Filter data based on specific column values. Parameter names correspond to your NocoDB column names.

- County: Filter by one or more county names. Provide multiple values by repeating the parameter (e.g., ?County=Berks&County=Bucks) or as a comma-separated string (e.g., ?County=Berks,Bucks).
- Populations (Assuming your NocoDB column is 'Populations Served'): Filter by populations served. Supports multiple values similar to County and uses a like operator for partial matches.
- Resource Type: Filter by one or more resource types. Supports multiple values similar to County.
- Category: Filter by one or more categories. Supports multiple values similar to County.
- search (Optional, string): A general search term that looks for matches in the 'Location Name', 'Organization', and 'Category' columns (configurable in the worker).

### Distance Sorting Parameters
Sort resources by their distance from a given latitude and longitude.

- userLat (Required for distance sort, float): The user's latitude.
- userLon (Required for distance sort, float): The user's longitude.
- sort (Required for distance sort, string, value: distance): Enables distance-based sorting.

#### Important Note on Distance Sorting: 

Due to NocoDB's sorting limitations with dynamic calculations, distance sorting is performed within the Cloudflare Worker. This involves:

- Fetching a limited number of records (currently 1000) matching the filters.
- Calculating the distance for each fetched record.
- Sorting the records by distance within the worker.
- Applying pagination to the sorted results.
- The totalRows in the pageInfo for distance-sorted results reflects the number of records fetched for calculation (up to the limit), not the absolute total. For an accurate total count with distance filtering, a separate count query (without distance parameters) is needed.

## Examples

### Basic Examples

- Fetching the first page of resources (default limit of 25):


[https://resourcesdatabaseproxy.crodican.workers.dev/](https://resourcesdatabaseproxy.crodican.workers.dev/)

- Fetching page 3 with a limit of 10:

[https://resourcesdatabaseproxy.crodican.workers.dev/?page=3&limit=10](https://resourcesdatabaseproxy.crodican.workers.dev/?page=3&limit=10)

- Sorting resources by name in ascending order:

[https://resourcesdatabaseproxy.crodican.workers.dev/?sort=Location%20Name](https://resourcesdatabaseproxy.crodican.workers.dev/?sort=Location%20Name)

- Sorting resources by date in descending order and then by name in ascending order:

[https://resourcesdatabaseproxy.crodican.workers.dev/?sort=-Date,Location%20Name](https://resourcesdatabaseproxy.crodican.workers.dev/?sort=-Date,Location%20Name)

- Fetching only the "Location Name" and "Organization" fields:

```
[https://resourcesdatabaseproxy.crodican.workers.dev/?fields=Location%20Name,Organization](https://resourcesdatabaseproxy.crodican.workers.dev/?fields=Location%20Name,Organization)
```

Fetching a single record with ID "rec1234567890":

```
[https://resourcesdatabaseproxy.crodican.workers.dev/?recordId=rec1234567890](https://resourcesdatabaseproxy.crodican.workers.dev/?recordId=rec1234567890)
```

- Getting the total count of all resources:

```
[https://resourcesdatabaseproxy.crodican.workers.dev/?count=1](https://resourcesdatabaseproxy.crodican.workers.dev/?count=1)
```

