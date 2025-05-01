import React from 'react';
import { Resource } from '../types/Resource';
import ResourceCard from './ResourceCard';

interface ResourceListProps {
  resources: Resource[];
  currentPage: number;
  pageSize: number;
  totalResources: number;
  onLoadMore: () => void;
  onFacetClick: (filterType: string, value: string) => void;
}

const ResourceList: React.FC<ResourceListProps> = ({ 
  resources, 
  currentPage, 
  pageSize, 
  totalResources, 
  onLoadMore,
  onFacetClick
}) => {
  const startResult = ((currentPage - 1) * pageSize) + 1;
  const endResult = Math.min(currentPage * pageSize, totalResources);
  const hasMoreResources = endResult < totalResources;

  return (
    <div className="resource-list mt-4">
      <div id="counter" className="results-header">
        <h4 className="results-count">
          Results {startResult}-{endResult} of {totalResources}
        </h4>
      </div>

      {resources.length > 0 ? (
        <>
          <div className="resources-container">
            {resources.map(resource => (
              <ResourceCard 
                key={resource.Id} 
                resource={resource}
                onFacetClick={onFacetClick}
              />
            ))}
          </div>
          
          {hasMoreResources && (
            <div id="load-more">
              <button 
                className="btn btn-primary"
                onClick={onLoadMore}
              >
                Load More
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center my-5">
          <h5>No resources found matching your filters.</h5>
          <p>Try adjusting your search criteria or clear some filters.</p>
        </div>
      )}
    </div>
  );
};

export default ResourceList;