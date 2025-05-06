# Hub Resource Database

The **Hub Resource Database** is a web application that allows users to search, filter, and sort through various Recovery resources in Regions 1 and 4 efficiently. It leverages a backend API powered by **NocoDB** to provide flexible querying and dynamic filtering capabilities.

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

https://hubresourcedatabase.crodican.workers.dev/


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
