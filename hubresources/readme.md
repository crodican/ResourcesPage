# Hub Resources Application

The **Hub Resources Application** is a web application that allows users to search, filter, and sort through various Recovery resources in Regions 1 and 4 efficiently. It leverages a backend API powered by **NocoDB** to provide flexible querying and dynamic filtering capabilities.

---

## **Overview**
The Regions 1 and 4 Recovery Hubs database of resources contains resources of the following types: Recovery Support, Family Support, Housing, and Transportation, further separated into categories, across the eight counties served:  Philadelphia (Region 1), and Berks, Bucks, Chester, Delaware, Lancaster, Montgomery, and Schuylkill Counties (Region 4).

The resources database has the following attributes:
ID, LOCATION NAME,  ORGANIZATION, COUNTY, RESOURCE TYPE,  CATEGORY, POPULATIONS SERVED, MORE INFO,  PHONE,  ADDRESS,  CITY, STATE,  ZIP CODE, WEBSITE,  IMAGE,  LATITUDE, LONGITUDE,  PHONE URL,  FULL ADDRESS, and GOOGLE MAPS URL.  
Of these, COUNTY, RESOURCE TYPE,  CATEGORY, and POPULATIONS SERVED are the filterable facets on our web app.

## **Features**
-   Search resources by name, organization, or category.
-   Filter resources based on:
    -   County
    -   Population Served
    -   Resource Type
    -   Category
-   Sort resources by any field (e.g., County, Organization, etc.).
-   Paginate through the results for better navigation.
-   Retrieve a specific resource by its ID.
-   Count the total number of resources that match specific filters.
-   **NEW**:  Filter resources by selecting multiple options within each filter category (e.g., multiple counties).

---

## **How to Use**

### **1. Filters**
You can filter resources using the following options:

#### **Counties**
-   Filter resources by the county they belong to.  You can select multiple counties to filter by.
-   Example Counties:
    -   Berks
    -   Bucks
    -   Chester
    -   Delaware
    -   Lancaster
    -   Montgomery
    -   Schuylkill
    -   Philadelphia

#### **Populations**
-   Filter resources by the population they serve.  You can select multiple populations to filter by.
-   Example Populations:
    -   Men
    -   Women
    -   Children
    -   Adolescents

#### **Resource Types**
-   Filter resources by the type of service they provide. You can select multiple resource types.
-   Example Resource Types:
    -   Recovery Support
    -   Family Support
    -   Housing
    -   Transportation

#### **Categories**
-   Filter resources by their category.  You can select multiple categories.
-   Example Categories:
    -   Single County Authority
    -   Center of Excellence
    -   Regional Recovery Hub
    -   Warm Handoff
    -   Family Counseling

### **2. Search**
You can search for resources using keywords. The search functionality is case-insensitive and applies to:
-   Resource Name
-   Organization
-   Category

### **3. Sorting**
Sort resources by any field in ascending or descending order. For example:
-   Sort by County (A-Z or Z-A).
-   Sort by Organization Name.

### **4. Pagination**
Navigate through the results using pagination.
-   Default: 25 results per page.

---

## **API Endpoints**

### **Base URL**

https://resourcesdatabaseproxy.crodican.workers.dev/


### **1. List All Resources**
Retrieve resources with optional filters, sorting, and pagination.

#### **Query Parameters**
| Parameter      | Type     | Description                                                                                   | Example                             |
|----------------|----------|-----------------------------------------------------------------------------------------------|-------------------------------------|
| `page`         | `number` | Specifies the page of results to display (default: 1).                                        | `page=1`                            |
| `limit`        | `number` | Number of resources per page (default: 25).                                                  | `limit=25`                          |
| `sort`         | `string` | Field to sort by. Use `-` prefix for descending order.                                        | `sort=County` or `sort=-County`     |
| `fields`       | `string` | Comma-separated list of fields to include in the response.                                    | `fields=Location Name,Organization` |
| `County`       | `string[]` | Filter by county.  **Can be a single value or a comma-separated list of values.**                                                                             | `County=Berks` or `County=Berks,Bucks`                      |
| `Populations`  | `string[]` | Filter by population served. **Can be a single value or a comma-separated list of values.**                                                                  | `Populations=Men` or `Populations=Men,Women`                   |
| `ResourceType` | `string[]` | Filter by resource type. **Can be a single value or a comma-separated list of values.**                                                                      | `ResourceType=Housing`  or `ResourceType=Housing,Transportation`              |
| `Category`     | `string[]` | Filter by category. **Can be a single value or a comma-separated list of values.**                                                                           | `Category=Warm Handoff` or `Category=Warm Handoff,Family Counseling`             |
| `search`       | `string` | Search term to look for in `Location Name`, `Organization`, or `Category` (case-insensitive). | `search=recovery`                   |

#### **Example Request**

GET https://resourcesdatabaseproxy.crodican.workers.dev/?page=1&limit=10&sort=County&County=Berks,Bucks&Category=Warm%20Handoff


#### **Example Response**
```json
{
  "page": 1,
  "pageSize": 10,
  "isFirstPage": true,
  "isLastPage": false,
  "totalRows": 50,
  "data": [
    {
      "Location Name": "Berks County Council on Chemical Abuse",
      "Organization": "Berks County Council on Chemical Abuse",
      "County": "Berks",
      "Website": "[https://cocaberks.org/](https://cocaberks.org/)"
    },
    {
      "Location Name": "Bucks County Recovery Center",
      "Organization": "Bucks Recovery Service",
      "County": "Bucks",
      "Website": "[https://example.com](https://example.com)"
    },
    {
      "Location Name": "Another Berks County Resource",
      "Organization": "Some Organization",
      "County": "Berks",
      "Website": "[https://example2.com](https://example2.com)"
    }
  ]
}

2. Retrieve a Single Resource by ID
Fetch a single resource by its unique ID.

Endpoint
GET /?recordId={resource_id}

Example Request
GET [https://resourcesdatabaseproxy.crodican.workers.dev/?recordId=5](https://resourcesdatabaseproxy.crodican.workers.dev/?recordId=5)

Example Response
{
  "Id": 5,
  "Location Name": "Berks County Council on Chemical Abuse",
  "Organization": "Berks County Council on Chemical Abuse",
  "County": "Berks",
  "Resource Type": "Recovery Support",
  "Category": "Single County Authority",
  "Populations Served": "Women",
  "Website": "[https://cocaberks.org/](https://cocaberks.org/)"
}

3. Count Resources
Retrieve the total number of resources that match specific filters.

Endpoint
GET /?count=1&{filters}

Example Request
GET [https://resourcesdatabaseproxy.crodican.workers.dev/?count=1&County=Berks,Bucks&Populations=Women](https://resourcesdatabaseproxy.crodican.workers.dev/?count=1&County=Berks,Bucks&Populations=Women)

Example Response
{
  "count": 35
}

How to Test
Example Test Cases
Paginated Data with Sorting and Filtering

[https://resourcesdatabaseproxy.crodican.workers.dev/?page=1&limit=10&sort=County&County=Berks,Bucks&Category=Warm%20Handoff](https://resourcesdatabaseproxy.crodican.workers.dev/?page=1&limit=10&sort=County&County=Berks,Bucks&Category=Warm%20Handoff)

Search Resources

[https://resourcesdatabaseproxy.crodican.workers.dev/?search=recovery](https://resourcesdatabaseproxy.crodican.workers.dev/?search=recovery)

Retrieve a Single Resource

[https://resourcesdatabaseproxy.crodican.workers.dev/?recordId=15](https://resourcesdatabaseproxy.crodican.workers.dev/?recordId=15)

Count Resources

[https://resourcesdatabaseproxy.crodican.workers.dev/?count=1&County=Berks,Bucks](https://resourcesdatabaseproxy.crodican.workers.dev/?count=1&County=Berks,Bucks)

Developer Notes
NocoDB Integration
This app uses the NocoDB API to:

Fetch records from the database.

Apply filters dynamically.

Perform searches.

Sort results based on specified fields.

Handle multiple filter values for County, Populations Served, Resource Type, and Category.

Key Changes
The API now supports filtering by multiple values for County, Populations Served, Resource Type, and Category.  The endpoint expects these filter parameters as comma-separated lists.

Error handling has been improved to return more detailed error messages from the NocoDB API.

Handling Case Sensitivity and Spaces
Case Sensitivity:  Filters and searches are case-insensitive.

Spaces:  Spaces in query parameters should be URL-encoded (e.g., Warm Handoff becomes Warm%20Handoff).

Contributing
We welcome contributions to improve the app. Please submit a pull request or open an issue for bug reports and feature requests.

License
This project is licensed under the MIT License. See the [LICENSE](LICENSE