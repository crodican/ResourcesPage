import React, { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import { FilterState } from '../types/Resource';

interface ResourceFiltersProps {
  filters: FilterState;
  onFilterChange: (filterType: keyof FilterState, value: string, isSelected: boolean) => void;
}

const ResourceFilters: React.FC<ResourceFiltersProps> = ({ filters, onFilterChange }) => {
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);
  
  // Define available filter options
  const counties = ['Philadelphia', 'Berks', 'Bucks', 'Chester', 'Delaware', 'Lancaster', 'Montgomery', 'Schuylkill'];
  const populations = ['Men', 'Women', 'Children', 'Adolescents'];
  const resourceTypes = ['Recovery Support', 'Family Support', 'Housing', 'Transportation'];
  
  // Define categories based on resource types
  const categories = {
    'Recovery Support': [
      'Single County Authority', 
      'Center of Excellence', 
      'Regional Recovery Hub', 
      'Recovery Community Organization', 
      'Warm Handoff', 
      'Treatment with RSS'
    ],
    'Family Support': [
      'Family Counseling', 
      'Family Peer Support', 
      'Family Assistance Program', 
      'Family Education Program', 
      'Family Resources'
    ],
    'Housing': [
      'Recovery House', 
      'Halfway House', 
      'Housing Assistance'
    ],
    'Transportation': [
      'Affordable Public Transportation', 
      'Carpool Service', 
      'Medical Assistance Transportation', 
      'Recovery Transportation Services', 
      'Vehicle Purchase Assistance'
    ],
    'Additional': [
      'Government', 
      'Other'
    ]
  };

  // Determine which categories to show based on selected resource types
  const visibleCategories = filters.resourceTypes.length === 0 
    ? [] 
    : [
        ...filters.resourceTypes.flatMap(type => categories[type as keyof typeof categories] || []),
        ...(filters.resourceTypes.length > 0 ? categories['Additional'] : [])
      ];

  const toggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  return (
    <div className="filters-section my-4">
      <div 
        className={`filter-toggle ${isFiltersVisible ? '' : 'collapsed'}`}
        onClick={toggleFilters}
      >
        <h2 className="mb-0">Filters</h2>
        <i className={`bi ${isFiltersVisible ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
      </div>

      {isFiltersVisible && (
        <Row className="mt-3">
          <Col lg={3} md={3} sm={10} className="mb-3">
            <h5>Counties</h5>
            {counties.map(county => (
              <div key={county} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`county-${county}`}
                  checked={filters.counties.includes(county)}
                  onChange={(e) => onFilterChange('counties', county, e.target.checked)}
                />
                <label className="form-check-label" htmlFor={`county-${county}`}>
                  {county}
                </label>
              </div>
            ))}
          </Col>

          <Col lg={3} md={3} sm={10} className="mb-3">
            <h5>Populations</h5>
            {populations.map(population => (
              <div key={population} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`population-${population}`}
                  checked={filters.populations.includes(population)}
                  onChange={(e) => onFilterChange('populations', population, e.target.checked)}
                />
                <label className="form-check-label" htmlFor={`population-${population}`}>
                  {population}
                </label>
              </div>
            ))}
          </Col>

          <Col lg={3} md={3} sm={10} className="mb-3">
            <h5>Resource Types</h5>
            {resourceTypes.map(type => (
              <div key={type} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`type-${type}`}
                  checked={filters.resourceTypes.includes(type)}
                  onChange={(e) => onFilterChange('resourceTypes', type, e.target.checked)}
                />
                <label className="form-check-label" htmlFor={`type-${type}`}>
                  {type}
                </label>
              </div>
            ))}
          </Col>

          <Col lg={3} md={3} sm={10} className="mb-3">
            <h5>Categories</h5>
            {visibleCategories.length > 0 ? (
              visibleCategories.map(category => (
                <div key={category} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`category-${category}`}
                    checked={filters.categories.includes(category)}
                    onChange={(e) => onFilterChange('categories', category, e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor={`category-${category}`}>
                    {category}
                  </label>
                </div>
              ))
            ) : (
              <p>Select a Resource Type to see categories</p>
            )}
          </Col>
        </Row>
      )}
    </div>
  );
};

export default ResourceFilters;