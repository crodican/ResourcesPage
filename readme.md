# Resources Database Proxy - Cloudflare Worker

A Cloudflare Worker that serves as a proxy and API layer for a NocoDB resources database, providing optimized endpoints for a recovery support resources web application.

# Resources Database Proxy - Cloudflare Worker

A Cloudflare Worker that serves as a proxy and API layer for a NocoDB resources database, providing optimized endpoints for a recovery support resources web application.

## 📋 Table of Contents

-   [Overview](#overview)
-   [API Endpoints](#api-endpoints)
-   [API Reference Table](#api-reference-table)
-   [Configuration](#configuration)
-   [Response Format](#response-format)
-   [Error Handling](#error-handling)
-   [Examples](#examples)
-   [Troubleshooting](#troubleshooting)

## <a id="overview">🎯 Overview</a>

This Cloudflare Worker provides a REST API that:

-   Proxies requests to a NocoDB database
-   Handles CORS for browser requests
-   Provides optimized endpoints for different use cases
-   Processes and formats data for client consumption
-   Implements comprehensive error handling

### Key Features

-   **Multiple specialized endpoints**  for different data needs
-   **Advanced filtering**  with support for complex queries
-   **Pagination**  for large datasets
-   **Search functionality**  across multiple fields
-   **Map-optimized data**  for geographic displays
-   **Standardized responses**  with success/error status

## <a id="api-endpoints">🌐 API Endpoints</a>

### Base URL

```
https://resourcesdatabaseproxy.crodican.workers.dev/
```

### Available Endpoints

#### 1.  **Main Data Endpoint**  -  `GET /`

Returns paginated, filtered data with full record details.

**Parameters:**

-   `page`  (integer): Page number (default: 1)
-   `limit`  (integer): Records per page (default: 25, max: 500)
-   `sort`  (string): Sort field (prefix with  `-`  for descending)
-   `search`  (string): Global search term
-   `County`  (array): Filter by counties
-   `Resource Type`  (array): Filter by resource types
-   `Category`  (array): Filter by categories
-   `Populations`  (array): Filter by populations served
-   `fields`  (string): Comma-separated field list
-   `viewId`  (string): NocoDB view ID

**Example:**

```
GET https://resourcesdatabaseproxy.crodican.workers.dev/?page=1&limit=25&County=Philadelphia&Resource%20Type=Housing&search=support
```

#### 2.  **Filter Options**  -  `GET /filters`

Returns all available filter values for dropdowns.

**Response includes:**

-   Counties list
-   Resource types list
-   Populations served list
-   Categories by resource type

**Example:**

```
GET https://resourcesdatabaseproxy.crodican.workers.dev/filters
```

#### 3.  **Map Markers**  -  `GET /map-markers`

Returns minimal data optimized for map display.

**Parameters:**  Same filtering parameters as main endpoint

**Returns:**  Lightweight records with coordinates and basic info

**Example:**

```
GET https://resourcesdatabaseproxy.crodican.workers.dev/map-markers?County=Philadelphia&Resource%20Type=Housing
```

#### 4.  **API Statistics**  -  `GET /stats`

Returns API metadata and available endpoints.

**Example:**

```
GET https://resourcesdatabaseproxy.crodican.workers.dev/stats
```

## <a id="api-reference-table">📊 API Reference Table</a>

Feature

Parameter

Type

Values

Example URL

**PAGINATION**

Page Number

`page`

integer

1, 2, 3...

`?page=2`

Records Per Page

`limit`

integer

1-500 (default: 25)

`?limit=50`

**SORTING**

Sort Ascending

`sort`

string

Column name

`?sort=Location%20Name`

Sort Descending

`sort`

string

`-ColumnName`

`?sort=-Organization`

Sort by Location

`sort`

string

`Location Name`

`?sort=Location%20Name`

Sort by Organization

`sort`

string

`Organization`

`?sort=Organization`

Sort by County

`sort`

string

`County`

`?sort=County`

**SEARCH**

Global Search

`search`

string

Any text

`?search=recovery`

Search Location Names

`search`

string

Location name

`?search=wellness%20center`

Search Organizations

`search`

string

Organization name

`?search=catholic%20social`

**COUNTY FILTERS**

Philadelphia

`County`

string

`Philadelphia`

`?County=Philadelphia`

Berks

`County`

string

`Berks`

`?County=Berks`

Bucks

`County`

string

`Bucks`

`?County=Bucks`

Chester

`County`

string

`Chester`

`?County=Chester`

Delaware

`County`

string

`Delaware`

`?County=Delaware`

Lancaster

`County`

string

`Lancaster`

`?County=Lancaster`

Montgomery

`County`

string

`Montgomery`

`?County=Montgomery`

Schuylkill

`County`

string

`Schuylkill`

`?County=Schuylkill`

Multiple Counties

`County`

array

Multiple values

`?County=Philadelphia&County=Bucks`

**RESOURCE TYPE FILTERS**

Recovery Support

`Resource%20Type`

string

`Recovery Support`

`?Resource%20Type=Recovery%20Support`

Family Support

`Resource%20Type`

string

`Family Support`

`?Resource%20Type=Family%20Support`

Housing

`Resource%20Type`

string

`Housing`

`?Resource%20Type=Housing`

Transportation

`Resource%20Type`

string

`Transportation`

`?Resource%20Type=Transportation`

Multiple Types

`Resource%20Type`

array

Multiple values

`?Resource%20Type=Housing&Resource%20Type=Transportation`

**POPULATION FILTERS**

Men

`Populations`

string

`Men`

`?Populations=Men`

Women

`Populations`

string

`Women`

`?Populations=Women`

Children

`Populations`

string

`Children`

`?Populations=Children`

Adolescents

`Populations`

string

`Adolescents`

`?Populations=Adolescents`

Unknown

`Populations`

string

`Unknown`

`?Populations=Unknown`

Multiple Populations

`Populations`

array

Multiple values

`?Populations=Men&Populations=Women`

**CATEGORY FILTERS (Recovery Support)**

Single County Authority

`Category`

string

`Single County Authority`

`?Category=Single%20County%20Authority`

Center of Excellence

`Category`

string

`Center of Excellence`

`?Category=Center%20of%20Excellence`

Regional Recovery Hub

`Category`

string

`Regional Recovery Hub`

`?Category=Regional%20Recovery%20Hub`

Recovery Community Org

`Category`

string

`Recovery Community Organization`

`?Category=Recovery%20Community%20Organization`

Warm Handoff

`Category`

string

`Warm Handoff`

`?Category=Warm%20Handoff`

Government

`Category`

string

`Government`

`?Category=Government`

Other

`Category`

string

`Other`

`?Category=Other`

**CATEGORY FILTERS (Family Support)**

Family Counseling

`Category`

string

`Family Counseling`

`?Category=Family%20Counseling`

Family Peer Support

`Category`

string

`Family Peer Support`

`?Category=Family%20Peer%20Support`

Family Assistance Program

`Category`

string

`Family Assistance Program`

`?Category=Family%20Assistance%20Program`

Family Education Program

`Category`

string

`Family Education Program`

`?Category=Family%20Education%20Program`

Family Resources

`Category`

string

`Family Resources`

`?Category=Family%20Resources`

**CATEGORY FILTERS (Housing)**

Recovery House

`Category`

string

`Recovery House`

`?Category=Recovery%20House`

Halfway House

`Category`

string

`Halfway House`

`?Category=Halfway%20House`

Housing Assistance

`Category`

string

`Housing Assistance`

`?Category=Housing%20Assistance`

DDAP Licensed

`Category`

string

`DDAP Licensed`

`?Category=DDAP%20Licensed`

**CATEGORY FILTERS (Transportation)**

Affordable Public Transportation

`Category`

string

`Affordable Public Transportation`

`?Category=Affordable%20Public%20Transportation`

Carpool Service

`Category`

string

`Carpool Service`

`?Category=Carpool%20Service`

Medical Assistance Transportation

`Category`

string

`Medical Assistance Transportation`

`?Category=Medical%20Assistance%20Transportation`

Recovery Transportation Services

`Category`

string

`Recovery Transportation Services`

`?Category=Recovery%20Transportation%20Services`

Vehicle Purchase Assistance

`Category`

string

`Vehicle Purchase Assistance`

`?Category=Vehicle%20Purchase%20Assistance`

**FIELD SELECTION**

Specific Fields

`fields`

string

Comma-separated

`?fields=Location%20Name,Organization,Phone`

Location Info Only

`fields`

string

Location fields

`?fields=Location%20Name,Address,City,State`

Contact Info Only

`fields`

string

Contact fields

`?fields=Phone,Website,Organization`

**ADVANCED COMBINATIONS**

Filtered + Sorted

Multiple

Mixed

Combined params

`?County=Philadelphia&sort=Location%20Name&limit=10`

Search + Filter

Multiple

Mixed

Combined params

`?search=recovery&Resource%20Type=Housing&page=1`

Multiple Filters

Multiple

Mixed

Combined params

`?County=Philadelphia&County=Bucks&Resource%20Type=Housing&Populations=Men`

Full Query

Multiple

Mixed

All parameters

`?page=2&limit=25&sort=-Organization&search=support&County=Philadelphia&Resource%20Type=Recovery%20Support&Category=Government&Populations=Men&Populations=Women`

### Complete Example URLs

#### Basic Usage

bash

```bash
# Get first page (25 records)
https://resourcesdatabaseproxy.crodican.workers.dev/

# Get 50 records per page
https://resourcesdatabaseproxy.crodican.workers.dev/?limit=50

# Get page 3
https://resourcesdatabaseproxy.crodican.workers.dev/?page=3
```

#### Filtering Examples

bash

```bash
# Filter by Philadelphia only
https://resourcesdatabaseproxy.crodican.workers.dev/?County=Philadelphia

# Filter by multiple counties
https://resourcesdatabaseproxy.crodican.workers.dev/?County=Philadelphia&County=Bucks&County=Chester

# Filter by housing resources
https://resourcesdatabaseproxy.crodican.workers.dev/?Resource%20Type=Housing

# Filter by populations served
https://resourcesdatabaseproxy.crodican.workers.dev/?Populations=Men&Populations=Women

# Filter by specific category
https://resourcesdatabaseproxy.crodican.workers.dev/?Category=Recovery%20House
```

#### Sorting Examples

bash

```bash
# Sort by location name (A-Z)
https://resourcesdatabaseproxy.crodican.workers.dev/?sort=Location%20Name

# Sort by organization (Z-A)
https://resourcesdatabaseproxy.crodican.workers.dev/?sort=-Organization

# Sort by county
https://resourcesdatabaseproxy.crodican.workers.dev/?sort=County
```

#### Search Examples

bash

```bash
# Search for "recovery"
https://resourcesdatabaseproxy.crodican.workers.dev/?search=recovery

# Search for "wellness center"
https://resourcesdatabaseproxy.crodican.workers.dev/?search=wellness%20center

# Search for "catholic"
https://resourcesdatabaseproxy.crodican.workers.dev/?search=catholic
```

#### Complex Combinations

bash

```bash
# Philadelphia housing resources, sorted by name
https://resourcesdatabaseproxy.crodican.workers.dev/?County=Philadelphia&Resource%20Type=Housing&sort=Location%20Name

# Search "recovery" in housing resources for men and women
https://resourcesdatabaseproxy.crodican.workers.dev/?search=recovery&Resource%20Type=Housing&Populations=Men&Populations=Women

# Get recovery houses in Philadelphia and Bucks county, page 2
https://resourcesdatabaseproxy.crodican.workers.dev/?County=Philadelphia&County=Bucks&Category=Recovery%20House&page=2

# Full complex query
https://resourcesdatabaseproxy.crodican.workers.dev/?page=1&limit=25&sort=Location%20Name&search=support&County=Philadelphia&Resource%20Type=Recovery%20Support&Category=Center%20of%20Excellence&Populations=Men&Populations=Women
```

## ⚙️ Configuration

### Filter Options

The worker includes predefined filter options that can be customized in the  `CONFIG`  object:

javascript

```javascript
FILTER_OPTIONS: {
    'Resource Type': ['Recovery Support', 'Family Support', 'Housing', 'Transportation'],
    'Populations Served': ['Men', 'Women', 'Children', 'Adolescents', 'Unknown'],
    'County': ['Philadelphia', 'Berks', 'Bucks', 'Chester', 'Delaware', 'Lancaster', 'Montgomery', 'Schuylkill'],
    'Category': {
        'Recovery Support': ['Single County Authority', 'Center of Excellence', ...],
        'Family Support': ['Family Counseling', 'Family Peer Support', ...],
        // ... more categories
    }
}
```

### Other Configuration

javascript

```javascript
CONFIG: {
    NOCODB_BASE_URL: 'https://app.nocodb.com/api/v2/tables/mu8v5qw718w8hkd/records',
    DEFAULT_VIEW_ID: 'vwr1w8nwoolz254r',
    DEFAULT_PAGE_SIZE: 25,
    MAX_DISTANCE_FETCH: 500,
    REQUIRED_MAP_FIELDS: 'Latitude,Longitude,ID,Location Name,Organization,Address,City,State,Zip Code,Phone,Website,Google Maps URL'
}
```

## 📊 Response Format

### Success Response

json

```json
{
    "success": true,
    "data": {
        "list": [...],
        "pageInfo": {
            "totalRows": 150,
            "currentPage": 1,
            "pageSize": 25,
            "hasNext": true,
            "hasPrev": false
        },
        "meta": {
            "appliedFilters": {...},
            "sort": "Location Name",
            "timestamp": "2024-01-15T10:30:00.000Z"
        }
    }
}
```

### Error Response

json

```json
{
    "success": false,
    "error": {
        "message": "Error description",
        "status": 500,
        "timestamp": "2024-01-15T10:30:00.000Z"
    }
}
```

## 🔍 Examples

### Basic Data Fetch

bash

```bash
curl "https://resourcesdatabaseproxy.crodican.workers.dev/?page=1&limit=10"
```

### Filtered Search

bash

```bash
curl "https://resourcesdatabaseproxy.crodican.workers.dev/?County=Philadelphia&Resource%20Type=Housing&search=recovery"
```

### Get Filter Options

bash

```bash
curl "https://resourcesdatabaseproxy.crodican.workers.dev/filters"
```

### Map Data

bash

```bash
curl "https://resourcesdatabaseproxy.crodican.workers.dev/map-markers?County=Philadelphia"
```

### Sorted Results

bash

```bash
curl "https://resourcesdatabaseproxy.crodican.workers.dev/?sort=Location%20Name&page=1"
```

### Descending Sort

bash

```bash
curl "https://resourcesdatabaseproxy.crodican.workers.dev/?sort=-Location%20Name"
```

## 🛠️ Error Handling

The worker implements comprehensive error handling:

### Common HTTP Status Codes

-   **200**: Success
-   **400**: Bad Request (invalid parameters)
-   **401**: Unauthorized (invalid API token)
-   **404**: Not Found
-   **500**: Internal Server Error
-   **502**: Bad Gateway (NocoDB connection issues)

### Error Types

1.  **Configuration Errors**: Missing API tokens
2.  **Network Errors**: NocoDB connection failures
3.  **Data Errors**: Invalid responses from NocoDB
4.  **Parameter Errors**: Invalid query parameters

## 🔧 Troubleshooting

### Common Issues

#### 1. "NOCODB_API_TOKEN secret is not defined"

**Solution:**  Add the  `NOCODB_API_TOKEN`  environment variable in Cloudflare Dashboard

#### 2. "Failed to communicate with database"

**Possible causes:**

-   Invalid NocoDB API token
-   NocoDB server is down
-   Network connectivity issues
-   Incorrect table/view IDs

#### 3. CORS Errors

**Solution:**  The worker includes CORS headers. If issues persist, check:

-   Origin restrictions
-   Request methods
-   Custom headers

#### 4. No Data Returned

**Check:**

-   Filter parameters are correct
-   Search terms match existing data
-   Pagination parameters are valid
-   View permissions in NocoDB

### Debug Mode

Enable debug logging by checking the Cloudflare Workers dashboard logs:

1.  Go to Cloudflare Dashboard
2.  Navigate to Workers & Pages
3.  Select your worker
4.  View the "Logs" tab

### Testing Endpoints

Test each endpoint individually:

bash

```bash
# Test basic connectivity
curl https://resourcesdatabaseproxy.crodican.workers.dev/stats

# Test filters
curl https://resourcesdatabaseproxy.crodican.workers.dev/filters

# Test main endpoint
curl https://resourcesdatabaseproxy.crodican.workers.dev/?limit=1

# Test map markers
curl https://resourcesdatabaseproxy.crodican.workers.dev/map-markers?limit=1
```

## 📝 Development Notes

### Adding New Endpoints

To add a new endpoint:

1.  Add a new case to the switch statement in  `handleRequest()`
2.  Create a handler function following the naming pattern
3.  Ensure proper error handling and response formatting

### Modifying Filters

To modify available filter options:

1.  Update the  `FILTER_OPTIONS`  in the  `CONFIG`  object
2.  Ensure the NocoDB database contains corresponding data
3.  Test the  `/filters`  endpoint

### Performance Considerations

-   The map-markers endpoint limits results to 500 records for performance
-   Consider implementing caching for frequently accessed data
-   Monitor worker execution time and memory usage

## 📚 Additional Resources

-   [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
-   [NocoDB API Documentation](https://docs.nocodb.com/)
-   [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

## 🤝 Support

For issues related to:

-   **Worker functionality**: Check the troubleshooting section above
-   **NocoDB connectivity**: Verify API tokens and database configuration
-   **Cloudflare deployment**: Consult Cloudflare Workers documentation

----------

**Last Updated:**  January 2024  
**Version:**  2.0  
**Cloudflare Worker Runtime:**  Latest`enter code here`