export interface Resource {
  Id: number;
  "Location Name": string;
  Organization: string;
  County: string;
  "Resource Type": string;
  Category: string;
  "Populations Served": string;
  "More Info": string | null;
  Phone: string;
  Address: string;
  City: string;
  State: string;
  "Zip Code": string;
  Website: string;
  Image: string;
  Latitude: string;
  Longitude: string;
  "Phone URL": string;
  "Full Address": string;
  "Google Maps URL": string;
}

export interface ApiResponse {
  list: Resource[];
  pageInfo: {
    totalRows: number;
    page: number;
    pageSize: number;
    isFirstPage: boolean;
    isLastPage: boolean;
  };
  stats: {
    dbQueryTime: string;
  };
}

export type SortOption = 'relevance' | 'alphabetical' | 'distance';

export interface FilterState {
  counties: string[];
  populations: string[];
  resourceTypes: string[];
  categories: string[];
  searchTerms: string[];
}