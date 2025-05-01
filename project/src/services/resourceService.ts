import { ApiResponse, Resource, SortOption } from '../types/Resource';

const API_URL = 'https://app.nocodb.com/api/v2/tables/mu8v5qw718w8hkd/records';
const API_TOKEN = 'IG35M16lOwlnPQWP3EcNcjI6nO7jXE4zBWvhdIOL';

export const fetchResources = async (page: number = 1): Promise<ApiResponse> => {
  try {
    const response = await fetch(API_URL, {
      headers: {
        'xc-token': API_TOKEN,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
};

export const filterResources = (
  resources: Resource[],
  filters: {
    counties: string[];
    populations: string[];
    resourceTypes: string[];
    categories: string[];
    searchTerms: string[];
  }
): Resource[] => {
  return resources.filter((resource) => {
    // Filter by counties
    if (filters.counties.length > 0 && !filters.counties.includes(resource.County)) {
      return false;
    }

    // Filter by populations
    if (filters.populations.length > 0) {
      const populationsArray = resource["Populations Served"]?.split(', ') || [];
      const hasMatchingPopulation = filters.populations.some(pop => 
        populationsArray.includes(pop)
      );
      if (!hasMatchingPopulation) return false;
    }

    // Filter by resource types
    if (filters.resourceTypes.length > 0 && !filters.resourceTypes.includes(resource["Resource Type"])) {
      return false;
    }

    // Filter by categories
    if (filters.categories.length > 0 && !filters.categories.includes(resource.Category)) {
      return false;
    }

    // Filter by search terms
    if (filters.searchTerms.length > 0) {
      const resourceText = `${resource["Location Name"]} ${resource.Organization} ${resource.Address} ${resource.City} ${resource.State} ${resource["Zip Code"]} ${resource.Category} ${resource["Resource Type"]}`.toLowerCase();
      
      const hasMatchingTerm = filters.searchTerms.some(term => 
        resourceText.includes(term.toLowerCase())
      );
      
      if (!hasMatchingTerm) return false;
    }

    return true;
  });
};

export const sortResources = (resources: Resource[], sortOption: SortOption, userLat?: number, userLng?: number): Resource[] => {
  const sortedResources = [...resources];

  switch (sortOption) {
    case 'alphabetical':
      return sortedResources.sort((a, b) => 
        a["Location Name"].localeCompare(b["Location Name"])
      );
    
    case 'distance':
      if (userLat && userLng) {
        return sortedResources.sort((a, b) => {
          const distA = calculateDistance(
            userLat, 
            userLng, 
            parseFloat(a.Latitude), 
            parseFloat(a.Longitude)
          );
          const distB = calculateDistance(
            userLat, 
            userLng, 
            parseFloat(b.Latitude), 
            parseFloat(b.Longitude)
          );
          return distA - distB;
        });
      }
      return sortedResources;
    
    case 'relevance':
    default:
      return sortedResources;
  }
};

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI/180);
};