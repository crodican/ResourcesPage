import React, { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';

import { Resource, FilterState, SortOption, ApiResponse } from '../types/Resource';
import { fetchResources, filterResources, sortResources } from '../services/resourceService';

import SearchBar from './SearchBar';
import FilterChips from './FilterChips';
import ResourceFilters from './ResourceFilters';
import ResourceList from './ResourceList';
import SortControls from './SortControls';

const ResourceSearch: React.FC = () => {
  // State for all resources and filtered resources
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalResources, setTotalResources] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter and sort state
  const [filters, setFilters] = useState<FilterState>({
    counties: [],
    populations: [],
    resourceTypes: [],
    categories: [],
    searchTerms: []
  });
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  
  // User location for distance sorting
  const [userLocation, setUserLocation] = useState<{lat?: number, lng?: number}>({});

  // Load resources on component mount
  useEffect(() => {
    const loadResources = async () => {
      try {
        setIsLoading(true);
        const apiResponse = await fetchResources(1);
        setAllResources(apiResponse.list);
        setFilteredResources(apiResponse.list);
        setTotalResources(apiResponse.pageInfo.totalRows);
        setCurrentPage(1);
        setPageSize(apiResponse.pageInfo.pageSize);
      } catch (error) {
        console.error('Error loading resources:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadResources();
    
    // Ask for geolocation for distance sorting
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  // Load more resources when requested
  const loadMoreResources = async () => {
    try {
      setIsLoading(true);
      const nextPage = currentPage + 1;
      const apiResponse = await fetchResources(nextPage);
      
      setAllResources(prev => [...prev, ...apiResponse.list]);
      setCurrentPage(nextPage);
      
      // Apply current filters to the new combined resources
      applyFiltersAndSort([...allResources, ...apiResponse.list]);
    } catch (error) {
      console.error('Error loading more resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filtering and sorting to resources
  const applyFiltersAndSort = (resources = allResources) => {
    let filtered = filterResources(resources, filters);
    filtered = sortResources(
      filtered, 
      sortOption, 
      userLocation.lat, 
      userLocation.lng
    );
    setFilteredResources(filtered);
  };

  // Effect to apply filters and sorting when they change
  useEffect(() => {
    applyFiltersAndSort();
  }, [filters, sortOption, allResources, userLocation]);

  // Handler for search terms
  const handleSearch = (term: string) => {
    if (term && !filters.searchTerms.includes(term)) {
      setFilters(prev => ({
        ...prev,
        searchTerms: [...prev.searchTerms, term]
      }));
    }
  };

  // Handler for filter changes
  const handleFilterChange = (filterType: keyof FilterState, value: string, isSelected: boolean) => {
    setFilters(prev => {
      if (isSelected) {
        return {
          ...prev,
          [filterType]: [...prev[filterType], value]
        };
      } else {
        return {
          ...prev,
          [filterType]: prev[filterType].filter(v => v !== value)
        };
      }
    });
  };

  // Handler for removing filters
  const handleRemoveFilter = (filterType: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].filter(v => v !== value)
    }));
  };

  // Handler for sort option changes
  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
  };

  // Handler for facet clicks from resource cards
  const handleFacetClick = (filterType: string, value: string) => {
    const mappedFilterType = filterType === 'resourceTypes' ? 'resourceTypes' : 
                            filterType === 'categories' ? 'categories' :
                            filterType === 'populations' ? 'populations' : 'counties';
    
    if (!filters[mappedFilterType as keyof FilterState].includes(value)) {
      setFilters(prev => ({
        ...prev,
        [mappedFilterType]: [...prev[mappedFilterType as keyof FilterState], value]
      }));
    }
  };

  return (
    <div className="resource-search">
      <div className="search-container">
        <SearchBar onSearch={handleSearch} />
        
        <FilterChips 
          filters={filters} 
          onRemoveFilter={handleRemoveFilter} 
        />
      </div>
      
      <ResourceFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      
      <Row className="mb-3">
        <Col className="d-flex justify-content-end">
          <SortControls 
            sortOption={sortOption}
            onSortChange={handleSortChange}
          />
        </Col>
      </Row>
      
      <ResourceList 
        resources={filteredResources}
        currentPage={currentPage}
        pageSize={pageSize}
        totalResources={filteredResources.length}
        onLoadMore={loadMoreResources}
        onFacetClick={handleFacetClick}
      />
      
      {isLoading && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceSearch;