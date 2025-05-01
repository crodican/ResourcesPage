import React from 'react';
import { Resource } from '../types/Resource';

interface ResourceCardProps {
  resource: Resource;
  onFacetClick: (filterType: string, value: string) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onFacetClick }) => {
  // Split populations and counties into arrays
  const populations = resource["Populations Served"]?.split(', ') || [];
  const counties = resource.County?.split(', ') || [resource.County];

  return (
    <div className="resourceCard shadow-lg text-bg-white br-5-5-5-5 mb-5">
      <div className="row no-gutters p-0">
        <div className="card-sidenav col-2 d-flex flex-column justify-content-between align-items-center p-0">
          <a href={resource.Website} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white">
            <i className="bi bi-globe"></i>
          </a>
          <a href={resource["Phone URL"]} className="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white">
            <i className="bi bi-telephone-fill"></i>
          </a>
          <a href={resource["Google Maps URL"]} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white">
            <i className="bi bi-geo-alt-fill"></i>
          </a>
        </div>
        <div className="card-body col-10 p-4">
          <div className="row">
            <div className="col">
              <h3 className="text-secondary" style={{ fontWeight: 400, marginBottom: 0, lineHeight: '1.2em', fontSize: '36px' }}>
                {resource["Location Name"]}
              </h3>
              <h5 style={{ fontWeight: 100, marginTop: 0, fontSize: '18px' }}>
                {resource.Organization}
              </h5>
              <div className="my-2">
                <span 
                  className="badge text-black bg-pink py-2 my-1 me-1"
                  onClick={() => onFacetClick('resourceTypes', resource["Resource Type"])}
                >
                  {resource["Resource Type"]}
                </span>
                <span 
                  className="badge text-black bg-pink py-2 my-1"
                  onClick={() => onFacetClick('categories', resource.Category)}
                >
                  {resource.Category}
                </span>
              </div>
              <h6>Phone: {resource.Phone}</h6>
              <p>
                {resource.Address} <br />
                {resource.City}, {resource.State}, {resource["Zip Code"]}
              </p>
            </div>
            <div className="col-md-4 d-flex justify-content-end align-items-start">
              {resource.Image && (
                <img className="cardImage" src={resource.Image} alt={`${resource["Location Name"]} logo`} />
              )}
            </div>
          </div>
          
          <h6>Populations Served:</h6>
          <div>
            {populations.map((population, index) => (
              <span 
                key={index} 
                className="badge text-black bg-pink py-2 my-1 me-1"
                onClick={() => onFacetClick('populations', population.trim())}
              >
                {population.trim()}
              </span>
            ))}
          </div>
          
          <h6>Counties Served:</h6>
          <div>
            {counties.map((county, index) => (
              <span 
                key={index} 
                className="badge text-black bg-pink py-2 my-1 me-1"
                onClick={() => onFacetClick('counties', county.trim())}
              >
                {county.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;