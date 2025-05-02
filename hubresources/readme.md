# Resource Finder Application

The **Resource Finder Application** is a web application that allows users to search, filter, and sort through various resources efficiently. It leverages a backend API powered by **NocoDB** to provide flexible querying and dynamic filtering capabilities.

---

## **Features**
- Search resources by name, organization, or category.
- Filter resources based on:
  - County
  - Population Served
  - Resource Type
  - Category
- Sort resources by any field (e.g., County, Organization, etc.).
- Paginate through the results for better navigation.
- Retrieve a specific resource by its ID.
- Count the total number of resources that match specific filters.

---

## **How to Use**

### **1. Filters**
You can filter resources using the following options:

#### **Counties**
- Filter resources by the county they belong to.
- Example Counties:
  - Berks
  - Bucks
  - Chester
  - Delaware
  - Lancaster
  - Montgomery
  - Schuylkill

#### **Populations**
- Filter resources by the population they serve.
- Example Populations:
  - Men
  - Women
  - Children
  - Adolescents

#### **Resource Types**
- Filter resources by the type of service they provide.
- Example Resource Types:
  - Recovery Support
  - Family Support
  - Housing
  - Transportation

#### **Categories**
- Filter resources by their category.
- Example Categories:
  - Single County Authority
  - Center of Excellence
  - Regional Recovery Hub
  - Warm Handoff
  - Family Counseling

### **2. Search**
You can search for resources using keywords. The search functionality is case-insensitive and applies to:
- Resource Name
- Organization
- Category

### **3. Sorting**
Sort resources by any field in ascending or descending order. For example:
- Sort by County (A-Z or Z-A).
- Sort by Organization Name.

### **4. Pagination**
Navigate through the results using pagination. 
- Default: 25 results per page.

---

## **API Endpoints**

### **Base URL**
```
https://resourcesdatabaseproxy.crodican.workers.dev/
```

### **1. List All Resources**
Retrieve resources with optional filters, sorting, and pagination.

#### **Query Parameters**
| Parameter      | Type     | Description                                                                                   | Example                             |
|----------------|----------|-----------------------------------------------------------------------------------------------|-------------------------------------|
| `page`         | `number` | Specifies the page of results to display (default: 1).                                        | `page=1`                            |
| `limit`        | `number` | Number of resources per page (default: 25).                                                  | `limit=25`                          |
| `sort`         | `string` | Field to sort by. Use `-` prefix for descending order.                                        | `sort=County` or `sort=-County`     |
| `fields`       | `string` | Comma-separated list of fields to include in the response.                                    | `fields=Location Name,Organization` |
| `County`       | `string` | Filter by county.                                                                             | `County=Berks`                      |
| `Populations`  | `string` | Filter by population served.                                                                  | `Populations=Men`                   |
| `ResourceType` | `string` | Filter by resource type.                                                                      | `ResourceType=Housing`              |
| `Category`     | `string` | Filter by category.                                                                           | `Category=Warm Handoff`             |
| `search`       | `string` | Search term to look for in `Location Name`, `Organization`, or `Category` (case-insensitive). | `search=recovery`                   |

#### **Example Request**
```
GET https://resourcesdatabaseproxy.crodican.workers.dev/?page=1&limit=25&sort=County&fields=Location%20Name,Organization,County,Website&Category=Warm%20Handoff&search=recovery
```

#### **Example Response**
```json
{
  "page": 1,
  "pageSize": 25,
  "isFirstPage": true,
  "isLastPage": false,
  "totalRows": 100,
  "data": [
    {
      "Location Name": "Berks County Council on Chemical Abuse",
      "Organization": "Berks County Council on Chemical Abuse",
      "County": "Berks",
      "Website": "https://cocaberks.org/"
    },
    {
      "Location Name": "Warm Handoff Program",
      "Organization": "Bucks Recovery Service",
      "County": "Bucks",
      "Website": "https://example.com"
    }
  ]
}
```

---

### **2. Retrieve a Single Resource by ID**
Fetch a single resource by its unique ID.

#### **Endpoint**
```
GET /?recordId={resource_id}
```

#### **Example Request**
```
GET https://resourcesdatabaseproxy.crodican.workers.dev/?recordId=5
```

#### **Example Response**
```json
{
  "Id": 5,
  "Location Name": "Berks County Council on Chemical Abuse",
  "Organization": "Berks County Council on Chemical Abuse",
  "County": "Berks",
  "Resource Type": "Recovery Support",
  "Category": "Single County Authority",
  "Populations Served": "Women",
  "Website": "https://cocaberks.org/"
}
```

---

### **3. Count Resources**
Retrieve the total number of resources that match specific filters.

#### **Endpoint**
```
GET /?count=1&{filters}
```

#### **Example Request**
```
GET https://resourcesdatabaseproxy.crodican.workers.dev/?count=1&County=Berks&Populations=Women
```

#### **Example Response**
```json
{
  "count": 23
}
```

---

## **How to Test**

### **Example Test Cases**
1. **Paginated Data with Sorting and Filtering**
   ```
   https://resourcesdatabaseproxy.crodican.workers.dev/?page=1&limit=10&sort=County&Category=Warm%20Handoff
   ```

2. **Search Resources**
   ```
   https://resourcesdatabaseproxy.crodican.workers.dev/?search=recovery
   ```

3. **Retrieve a Single Resource**
   ```
   https://resourcesdatabaseproxy.crodican.workers.dev/?recordId=15
   ```

4. **Count Resources**
   ```
   https://resourcesdatabaseproxy.crodican.workers.dev/?count=1&County=Berks
   ```

---

## **Developer Notes**

### **NocoDB Integration**
This app uses the NocoDB API to:
- Fetch records from the database.
- Apply filters dynamically using the `where` parameter.
- Perform searches using the `ilike` operator for case-insensitivity.
- Sort results based on specified fields.

### **Handling Case Sensitivity and Spaces**
- **Case Sensitivity**: Filters and searches use the `ilike` operator for case-insensitivity.
- **Spaces**: Spaces in query parameters are automatically URL-encoded (e.g., `Warm Handoff` becomes `Warm%20Handoff`).

---

## **Contributing**
We welcome contributions to improve the app. Please submit a pull request or open an issue for bug reports and feature requests.

---

## **License**
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.