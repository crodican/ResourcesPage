import React from 'react';
import { SortOption } from '../types/Resource';

interface SortControlsProps {
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
}

const SortControls: React.FC<SortControlsProps> = ({ sortOption, onSortChange }) => {
  return (
    <div id="sort" className="sort-control mb-3">
      <h6 className="mb-0">Sort By:</h6>
      <select 
        className="form-select form-select-sm" 
        value={sortOption}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
      >
        <option value="relevance">Relevance</option>
        <option value="alphabetical">Alphabetical</option>
        <option value="distance">Distance</option>
      </select>
    </div>
  );
};

export default SortControls;