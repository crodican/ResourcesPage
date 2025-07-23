# Resource Database API

This document describes how to interact with the Resource Database API hosted on Cloudflare Workers.

**API Endpoint:** `https://resourcesdatabaseproxy.crodican.workers.dev/`

This API allows you to retrieve and filter resource information, with support for pagination, enhanced filtering, sorting, and search capabilities.

This endpoint can serve as a customizable API layer between your frontend application and a NocoDB database. It efficiently handles complex queries, pagination, and specific sorting requirements while ensuring the security of your NocoDB API token.

## Features

* ✅ **Filtering:** Filter records based on multiple criteria.
* 🔍 **Full-text Search:** Perform searches across multiple fields.
* 📄 **Pagination:** Implement page-based navigation of results.
* 🧭 **Distance-Based Sorting (In Development):** Special handling for sorting records by distance.
* 🔐 **Secure Token Management:** Keeps your NocoDB API token confidential.
* 🌐 **CORS Support:** Enables access from browser clients.

## Usage

All requests should be made to the base API endpoint. Parameters are passed as URL query strings.

### Limiting Total Rows / Pagination

The API uses `page` and `limit` parameters for pagination.

* **`limit`**: Controls the number of rows (records) to display per page.
    * **To show `x` number of rows per page:** Use the `limit` query parameter.
    * Example: `https://resourcesdatabaseproxy.crodican.workers.dev/?limit=10` (shows 10 rows per page)
* **`page`**: Specifies which page of results to retrieve.
    * **To view a specific page:** Use the `page` query parameter in conjunction with `limit`.
    * Example: `https://resourcesdatabaseproxy.crodican.workers.dev/?limit=5&page=2` (shows 5 rows, from the second page of results)

### Filtering by Facets and Taxonomies

You can filter the results using various parameters corresponding to the available facets and taxonomies. For filters that allow multiple selections (e.g., `County`), you can repeat the parameter in the URL.

### API Parameters

The following parameters can be used to query the API:

| Parameter       | Description                                    | Example                     |
| :-------------- | :--------------------------------------------- | :-------------------------- |
| `page`          | Page number (1-based)                          | `?page=2`                   |
| `limit`         | Number of records per page                     | `?limit=50`                 |
| `sort`          | Field to sort by                               | `?sort=distance`            |
| `fields`        | Comma-separated fields to return               | `?fields=ID,Name`           |
| `recordId`      | Specific record ID to retrieve                 | `?recordId=123`             |
| `County`        | Filter by county (multiple allowed)            | `?County=Los Angeles`       |
| `Populations`   | Filter by population served                    | `?Populations=Seniors`      |
| `Resource Type` | Filter by resource type                        | `?Resource Type=Healthcare` |
| `Category`      | Filter by category                             | `?Category=Medical`         |
| `search`        | Full-text search term                          | `?search=hospital`          |
| `userLat`       | User latitude for distance sort                | `?userLat=34.0522`          |
| `userLon`       | User longitude for distance sort               | `?userLon=-118.2437`        |

#### Filter Options:

* **`County`**: Filters resources by one or more counties.
    * **Options:** Philadelphia, Berks, Bucks, Chester, Delaware, Lancaster, Montgomery, Schuylkill
    * Example: `https://resourcesdatabaseproxy.crodican.workers.dev/?County=Philadelphia`
    * Example (multiple counties): `https://resourcesdatabaseproxy.crodican.workers.dev/?County=Philadelphia&County=Delaware`

* **`Populations`** (`Populations Served` in the backend): Filters resources by populations served.
    * **Options:** Men, Women, Children, Adolescents
    * Example: `https://resourcesdatabaseproxy.crodican.workers.dev/?Populations=Men`
    * Example (multiple populations): `https://resourcesdatabaseproxy.crodican.workers.dev/?Populations=Men&Populations=Children`

* **`Resource Type`**: Filters resources by their type.
    * **Options:** Recovery Support, Family Support, Housing, Transportation
    * Example: `https://resourcesdatabaseproxy.crodican.workers.dev/?Resource%20Type=Housing` (Note: Spaces in parameter names must be URL-encoded as `%20`)
    * Example (multiple resource types): `https://resourcesdatabaseproxy.crodican.workers.dev/?Resource%20Type=Housing&Resource%20Type=Transportation`

* **`Category`**: Filters resources by their category.
    * **Options:** Affordable Public Transportation, Carpool Service, Center of Excellence, Family Assistance Program, Family Counseling, Family Education Program, Family Peer Support, Family Resources, Halfway House, Housing Assistance, Medical Assistance Transportation, Recovery Community Organization, Recovery House, Recovery Transportation Services, Regional Recovery Hub, Single County Authority, Vehicle Purchase Assistance, Warm Handoff, Government, Other.
    * Example: `https://resourcesdatabaseproxy.crodican.workers.dev/?Category=Halfway%20House`
    * Example (multiple categories): `https://resourcesdatabaseproxy.crodican.workers.dev/?Category=Halfway%20House&Category=Recovery%20House`

* **`search`**: Performs a full-text search across several fields (Location Name, Organization, County, Resource Type, Category, Populations Served, City, Full Address).
    * Example: `https://resourcesdatabaseproxy.crodican.workers.dev/?search=recovery`

### Combining Filters

You can combine any of the above filter parameters to narrow down your search results.

* Example: Get the first 5 "Housing" resources for "Philadelphia" county that serve "Men".
    `https://resourcesdatabaseproxy.crodican.workers.dev/?limit=5&Resource%20Type=Housing&County=Philadelphia&Populations=Men`

### Sorting

* **`sort`**: Sorts the results.
    * Example: `https://resourcesdatabaseproxy.crodican.workers.dev/?sort=Location%20Name` (sorts by Location Name)
    * The worker code also indicates experimental support for `sort=distance` if `userLat` and `userLon` are provided, though this appears to be under development in the provided code snippet.

### Fetching a Single Record

* **`recordId`**: Retrieves a single record by its unique ID.
    * Example: `https://resourcesdatabaseproxy.crodican.workers.dev/?recordId=someUniqueId123`
* **`fields`**: When fetching a single record or a list, you can specify which fields to return, separated by commas.
    * Example: `https://resourcesdatabaseproxy.crodican.workers.dev/?recordId=someUniqueId123&fields=Location%20Name,Full%20Address`

## Examples

### Basic Examples

- Fetching the first page of resources (default limit of 25):

`https://resourcesdatabaseproxy.crodican.workers.dev/`

- Fetching page 3 with a limit of 10:

`https://resourcesdatabaseproxy.crodican.workers.dev/?page=3&limit=10`

- Sorting resources by name in ascending order:

`https://resourcesdatabaseproxy.crodican.workers.dev/?sort=Location%20Name`

- Sorting resources by date in descending order and then by name in ascending order:

`https://resourcesdatabaseproxy.crodican.workers.dev/?sort=-Date,Location%20Name`

- Fetching only the "Location Name" and "Organization" fields:

`https://resourcesdatabaseproxy.crodican.workers.dev/?fields=Location%20Name,Organization`

Fetching a single record with ID "rec1234567890":

`https://resourcesdatabaseproxy.crodican.workers.dev/?recordId=rec1234567890`

- Getting the total count of all resources:

`https://resourcesdatabaseproxy.crodican.workers.dev/?count=1`