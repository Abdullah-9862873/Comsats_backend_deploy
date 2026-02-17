# Job Posting API Documentation

## Base URL
```
http://localhost:5000/api/jobs
```

## Authentication
All company-specific endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Job Posting
**POST** `/api/jobs`
- **Access**: Private (Company only)
- **Description**: Create a new job posting

**Request Body:**
```json
{
  "jobTitle": "Full Stack Developer Intern",
  "location": "Lahore, Pakistan",
  "workType": "Hybrid",
  "duration": "3 months",
  "salary": "Rs. 25,000/month",
  "startDate": "2025-08-15",
  "endDate": "2025-11-15",
  "jobDescription": "We are looking for a passionate Full Stack Developer intern to join our team...",
  "requirements": [
    "Currently pursuing CS/IT degree",
    "Basic knowledge of JavaScript",
    "Familiarity with React.js",
    "Good communication skills"
  ],
  "technologyStack": [
    "React.js",
    "Node.js",
    "MongoDB",
    "Express.js"
  ],
  "isUrgent": false,
  "tags": ["internship", "full-stack", "remote-friendly"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job posted successfully",
  "data": {
    "_id": "64f7b123456789abc",
    "jobTitle": "Full Stack Developer Intern",
    "location": "Lahore, Pakistan",
    "workType": "Hybrid",
    "companyId": "64f7a987654321def",
    "companyName": "Tech Solutions Inc",
    "status": "Active",
    "createdAt": "2025-07-31T10:30:00.000Z",
    // ... other fields
  }
}
```

### 2. Get Company Jobs
**GET** `/api/jobs/company?status=Active&page=1&limit=10`
- **Access**: Private (Company only)
- **Description**: Get all jobs posted by the authenticated company

**Query Parameters:**
- `status` (optional): Filter by job status (Active, Inactive, Closed, Draft)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): asc or desc (default: desc)

### 3. Get All Jobs (Public)
**GET** `/api/jobs?search=developer&location=lahore&page=1`
- **Access**: Public
- **Description**: Get all active job postings (for browsing)

**Query Parameters:**
- `search` (optional): Search in job title, description, company name
- `location` (optional): Filter by location
- `workType` (optional): Filter by work type
- `page`, `limit`, `sortBy`, `sortOrder` (same as above)

### 4. Get Job by ID
**GET** `/api/jobs/:id`
- **Access**: Public
- **Description**: Get detailed information about a specific job

### 5. Update Job
**PUT** `/api/jobs/:id`
- **Access**: Private (Company only - own jobs)
- **Description**: Update an existing job posting

### 6. Delete Job
**DELETE** `/api/jobs/:id`
- **Access**: Private (Company only - own jobs)
- **Description**: Delete a job posting

### 7. Get Company Job Statistics
**GET** `/api/jobs/stats/company`
- **Access**: Private (Company only)
- **Description**: Get job statistics for company dashboard

**Response:**
```json
{
  "success": true,
  "data": {
    "totalJobs": 15,
    "activeJobs": 8,
    "inactiveJobs": 3,
    "closedJobs": 4,
    "recentJobs": [
      {
        "_id": "64f7b123456789abc",
        "jobTitle": "Full Stack Developer Intern",
        "status": "Active",
        "createdAt": "2025-07-31T10:30:00.000Z",
        "applicationsCount": 12,
        "viewsCount": 45
      }
      // ... more jobs
    ]
  }
}
```

## Error Responses

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Missing required fields: Job title, Location"
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "message": "No token provided, authorization denied"
}
```

**Authorization Error (403):**
```json
{
  "success": false,
  "message": "Access denied. Company account required."
}
```

**Not Found Error (404):**
```json
{
  "success": false,
  "message": "Job not found"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "message": "Server error while creating job posting",
  "error": "Detailed error message"
}
```

## Frontend Integration Example

```javascript
// Create a new job posting
const createJob = async (jobData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(jobData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Job created successfully
      console.log('Job posted:', result.data);
      // Update UI, show success message, etc.
    } else {
      // Handle error
      console.error('Error:', result.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

// Get company statistics for dashboard
const getCompanyStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/jobs/stats/company', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Update dashboard counters
      setActiveJobs(result.data.activeJobs);
      setTotalJobs(result.data.totalJobs);
      // ... update other stats
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};
```
