addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // Extract query parameters
  const page = parseInt(url.searchParams.get('page')) || 1; // Default page is 1
  const pageSize = parseInt(url.searchParams.get('limit')) || 25; // Default limit is 25
  const offset = (page - 1) * pageSize; // Calculate offset for pagination
  const sort = url.searchParams.get('sort') || ''; // Sorting fields
  const fields = url.searchParams.get('fields') || ''; // Specific fields to include
  const recordId = url.searchParams.get('recordId'); // Single record retrieval
  const countOnly = url.searchParams.get('count') === '1'; // Count rows instead of returning data
  const viewId = url.searchParams.get('viewId') || 'vwr1w8nwoolz254r'; // Default viewId
  
  // Extract filters for constructing the "where" clause
  const filters = {
    County: url.searchParams.get('County'),
    'Populations Served': url.searchParams.get('Populations'),
    'Resource Type': url.searchParams.get('ResourceType'),
    Category: url.searchParams.get('Category'),
    search: url.searchParams.get('search'),
  };

  const whereClause = constructWhereClause(filters);
  const encodedWhereClause = encodeURIComponent(whereClause);

  // Construct the base NocoDB API URL
  let nocodbApiUrl = `https://app.nocodb.com/api/v2/tables/mu8v5qw718w8hkd/records`;

  // Check if "recordId" is provided for single record retrieval
  if (recordId) {
    nocodbApiUrl += `/${recordId}`;
  } else if (countOnly) {
    // If count is requested, modify the API URL
    nocodbApiUrl += `/count?where=${encodedWhereClause}&viewId=${viewId}`;
  } else {
    // Otherwise, construct the URL for paginated data
    nocodbApiUrl += `?limit=${pageSize}&offset=${offset}&where=${encodedWhereClause}&viewId=${viewId}`;
    if (sort) nocodbApiUrl += `&sort=${sort}`;
    if (fields) nocodbApiUrl += `&fields=${fields}`;
  }

  const apiToken = 'IG35M16lOwlnPQWP3EcNcjI6nO7jXE4zBWvhdIOL';

  try {
    const response = await fetch(nocodbApiUrl, {
      headers: {
        'xc-token': apiToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`NocoDB API request failed with status: ${response.status}`);
      return new Response('Failed to fetch data from NocoDB', { status: 500 });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Allow all origins
        'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow specific methods
        'Access-Control-Allow-Headers': '*', // Allow all headers
      },
    });
  } catch (error) {
    console.error('Error fetching data from NocoDB:', error);
    return new Response('Error fetching data from NocoDB', { status: 500 });
  }
}

// Function to dynamically construct the "where" clause for filtering
function constructWhereClause(filters) {
  const conditions = [];

  // Add conditions for each filter
  if (filters.County) {
    conditions.push(`(County,eq,${filters.County})`);
  }
  if (filters['Populations Served']) {
    conditions.push(`(Populations Served,like,${filters['Populations Served']})`);
  }
  if (filters['Resource Type']) {
    conditions.push(`(Resource Type,eq,${filters['Resource Type']})`);
  }
  if (filters.Category) {
    conditions.push(`(Category,eq,${filters.Category})`);
  }
  if (filters.search) {
    // Search across multiple fields
    conditions.push(`(Location Name,like,${filters.search})~or(Organization,like,${filters.search})~or(Category,like,${filters.search})`);
  }

  // Combine conditions with "AND"
  return conditions.length > 0 ? conditions.join('~and') : '';
}