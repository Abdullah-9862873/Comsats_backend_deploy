# Student Dashboard API Documentation

## Overview
This document describes the REST API endpoints for the Student Dashboard system. The API supports student registration, authentication, profile management, and file uploads.

## Base URL
```
http://localhost:5000/api/students
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Data Models

### Student Profile Structure
```json
{
  "_id": "string",
  "fullName": "string (required, non-editable)",
  "email": "string (required, non-editable)",
  "department": "string (required, non-editable)",
  "semester": "string (required, non-editable)",
  "profilePicture": "string (file path)",
  "profilePictureUrl": "string (full URL)",
  "cgpa": "number (0-4.0)",
  "phoneNumber": "string",
  "rollNumber": "string (unique)",
  "attendance": "number (0-100)",
  "backlogs": "number (min: 0)",
  "cv": {
    "filename": "string",
    "originalName": "string",
    "path": "string",
    "url": "string",
    "size": "number",
    "uploadedAt": "date"
  },
  "certificates": [
    {
      "_id": "string",
      "filename": "string",
      "originalName": "string",
      "path": "string",
      "url": "string",
      "size": "number",
      "uploadedAt": "date"
    }
  ],
  "profileCompleted": "boolean",
  "profileCompletionPercentage": "number (0-100)",
  "lastProfileUpdate": "date",
  "isActive": "boolean",
  "role": "string (always 'student')",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## API Endpoints

### 1. Register Student
**POST** `/register`

Register a new student account.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "department": "Computer Science",
  "semester": "6th"
}
```

**Validation Rules:**
- fullName: Required, non-empty string
- email: Required, valid email format
- password: Required, minimum 6 characters
- department: Required, must be one of the predefined departments
- semester: Required, must be one of: 5th, 6th, 7th, 8th

**Response (201):**
```json
{
  "success": true,
  "message": "Student registered successfully",
  "data": {
    "student": {
      "_id": "...",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "department": "Computer Science",
      "semester": "6th",
      "profileCompletionPercentage": 0,
      ...
    },
    "token": "jwt_token_here"
  }
}
```

### 2. Student Login
**POST** `/login`

Authenticate a student and get access token.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "student": {
      "_id": "...",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      ...
    },
    "token": "jwt_token_here"
  }
}
```

### 3. Get Student Profile
**GET** `/profile`

Get the authenticated student's complete profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "...",
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "department": "Computer Science",
    "semester": "6th",
    "profilePictureUrl": "http://localhost:5000/uploads/profiles/profile_123_456.jpg",
    "cgpa": 3.5,
    "phoneNumber": "+923001234567",
    "rollNumber": "CS-2020-123",
    "attendance": 85,
    "backlogs": 1,
    "cv": {
      "filename": "cv_123_456.pdf",
      "originalName": "john_doe_cv.pdf",
      "url": "http://localhost:5000/uploads/cvs/cv_123_456.pdf",
      "size": 2048576,
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    },
    "certificates": [
      {
        "_id": "...",
        "filename": "cert_123_456_certificate.pdf",
        "originalName": "web_development_certificate.pdf",
        "url": "http://localhost:5000/uploads/certificates/cert_123_456_certificate.pdf",
        "size": 1024000,
        "uploadedAt": "2024-01-15T11:00:00.000Z"
      }
    ],
    "profileCompletionPercentage": 87,
    "profileCompleted": true,
    ...
  }
}
```

### 4. Update Student Profile
**PUT** `/profile`

Update student profile with optional file uploads.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data Fields:**
- `cgpa`: number (0-4.0, optional)
- `phoneNumber`: string (valid phone number, optional)
- `rollNumber`: string (unique, optional)
- `attendance`: number (0-100, optional)
- `backlogs`: number (min: 0, optional)
- `profilePicture`: file (single image: JPEG, PNG, GIF, max 5MB, optional)
- `cv`: file (single document: PDF, DOC, DOCX, max 10MB, optional)
- `certificates`: files (multiple files: PDF, DOC, DOCX, Images, max 10MB each, max 5 files, optional)

**Example using curl:**
```bash
curl -X PUT http://localhost:5000/api/students/profile \
  -H "Authorization: Bearer <jwt_token>" \
  -F "cgpa=3.5" \
  -F "phoneNumber=+923001234567" \
  -F "rollNumber=CS-2020-123" \
  -F "attendance=85" \
  -F "backlogs=1" \
  -F "profilePicture=@/path/to/profile.jpg" \
  -F "cv=@/path/to/resume.pdf" \
  -F "certificates=@/path/to/cert1.pdf" \
  -F "certificates=@/path/to/cert2.jpg"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    // Updated student profile object with file URLs
  }
}
```

### 5. Delete Certificate
**DELETE** `/certificates/:certificateId`

Delete a specific certificate from the student's profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `certificateId`: The MongoDB ObjectId of the certificate to delete

**Response (200):**
```json
{
  "success": true,
  "message": "Certificate deleted successfully"
}
```

### 6. Get All Students (Admin/Supervisor)
**GET** `/all`

Get a paginated list of all students with filtering and sorting options.

**Headers:**
```
Authorization: Bearer <admin_or_supervisor_jwt_token>
```

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 10, max: 100)
- `department`: string (filter by department)
- `semester`: string (filter by semester)
- `search`: string (search in name, email, roll number)
- `sortBy`: string (default: 'createdAt', options: 'fullName', 'email', 'cgpa', 'attendance', 'createdAt')
- `sortOrder`: string (default: 'desc', options: 'asc', 'desc')

**Example Request:**
```
GET /all?page=1&limit=20&department=Computer%20Science&sortBy=cgpa&sortOrder=desc
```

**Response (200):**
```json
{
  "success": true,
  "message": "Students retrieved successfully",
  "data": {
    "students": [
      {
        // Student profile objects (without passwords)
      }
    ],
    "pagination": {
      "current": 1,
      "total": 5,
      "count": 20,
      "totalRecords": 95
    }
  }
}
```

### 7. Get Student Statistics (Admin/Supervisor)
**GET** `/stats`

Get comprehensive statistics about all students.

**Headers:**
```
Authorization: Bearer <admin_or_supervisor_jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Student statistics retrieved successfully",
  "data": {
    "overview": {
      "totalStudents": 150,
      "completedProfiles": 120,
      "avgCGPA": 3.2,
      "avgAttendance": 78.5,
      "totalBacklogs": 45
    },
    "byDepartment": [
      {
        "_id": "Computer Science",
        "count": 45,
        "avgCGPA": 3.4,
        "avgAttendance": 82
      },
      {
        "_id": "Software Engineering",
        "count": 38,
        "avgCGPA": 3.3,
        "avgAttendance": 79
      }
    ],
    "bySemester": [
      {
        "_id": "1st",
        "count": 25,
        "avgCGPA": 3.1
      },
      {
        "_id": "2nd",
        "count": 23,
        "avgCGPA": 3.2
      }
    ]
  }
}
```

## File Upload Specifications

### Supported File Types

**Profile Pictures:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- Maximum size: 5MB

**CV Documents:**
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Maximum size: 10MB

**Certificates:**
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- JPEG (.jpg, .jpeg)
- PNG (.png)
- Maximum size: 10MB per file
- Maximum 5 files per upload

### File Storage
- Files are stored in the `uploads/` directory on the server
- Each file type has its own subdirectory:
  - Profile pictures: `uploads/profiles/`
  - CVs: `uploads/cvs/`
  - Certificates: `uploads/certificates/`
- Files are accessible via HTTP at: `http://localhost:5000/uploads/...`

## Error Responses

### Common Error Formats

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "CGPA must be between 0.0 and 4.0",
      "param": "cgpa",
      "location": "body"
    }
  ]
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**Authorization Error (403):**
```json
{
  "success": false,
  "message": "Access denied. Student role required."
}
```

**Not Found Error (404):**
```json
{
  "success": false,
  "message": "Student not found"
}
```

**File Upload Error (400):**
```json
{
  "success": false,
  "message": "File too large. Maximum size allowed is 10MB."
}
```

**Duplicate Data Error (400):**
```json
{
  "success": false,
  "message": "Roll number already exists"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message (in development mode only)"
}
```

## Usage Examples

### Frontend Integration Example (JavaScript/React)

```javascript
// Register a new student
const registerStudent = async (studentData) => {
  const response = await fetch('/api/students/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(studentData)
  });
  
  const result = await response.json();
  if (result.success) {
    localStorage.setItem('token', result.data.token);
    return result.data.student;
  }
  throw new Error(result.message);
};

// Update profile with files
const updateProfile = async (formData) => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/students/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData // FormData object with files and other fields
  });
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message);
  }
  return result.data;
};

// Get profile data
const getProfile = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/students/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message);
  }
  return result.data;
};
```

## Security Considerations

1. **Password Hashing**: Passwords are hashed using bcrypt with salt rounds of 12
2. **JWT Tokens**: Tokens expire in 7 days
3. **File Validation**: Strict file type and size validation
4. **Input Sanitization**: All inputs are validated and sanitized
5. **Authentication**: Protected routes require valid JWT tokens
6. **Authorization**: Role-based access control for admin endpoints
7. **Data Protection**: Passwords are never returned in API responses

## Testing

Run the test suite:
```bash
node testStudentAPI.js
```

This will test:
- Student model validation
- Database operations
- Virtual fields and methods
- Unique constraints
- Static methods

## Environment Variables

Make sure these environment variables are set in your `.env` file:
```
MONGO_URI=mongodb://localhost:27017/your-database
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=5000
```
