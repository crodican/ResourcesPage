import React from 'react';
import { FilterState } from '../types/Resource';

interface FilterChipsProps {
  filters: FilterState;
  onRemoveFilter: (filterType: keyof FilterState, value: string) => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({ filters, onRemoveFilter }) => {
  const renderChips = (filterType: keyof FilterState, label: string) => {
    return filters[filterType].map((value, index) => (
      <div key={`${filterType}-${index}`} className="chip">
        <span>{label}: {value}</span>
        <span 
          className="close-chip" 
          onClick={() => onRemoveFilter(filterType, value)}
        >
          <i className="bi bi-x"></i>
        </span>
      </div>
    ));
  };

  return (
    <div className="filter-chips my-3">
      {filters.searchTerms.length > 0 && (
        <>
          {filters.searchTerms.map((term, index) => (
            <div key={`search-${index}`} className="chip">
              <span>Search: {term}</span>
              <span 
                className="close-chip" 
                onClick={() => onRemoveFilter('searchTerms', term)}
              >
                <i className="bi bi-x"></i>
              </span>
            </div>
          ))}
        </>
      )}
      {renderChips('counties', 'County')}
      {renderChips('populations', 'Population')}
      {renderChips('resourceTypes', 'Resource Type')}
      {renderChips('categories', 'Category')}
    </div>
  );
};

export default FilterChips;