# Vibefolio API Documentation

This document describes the API endpoints used in the Vibefolio application. The API is built using Next.js Route Handlers and interacts with Supabase for data persistence.

## Base URL

All API endpoints are relative to the base URL of the application (e.g., `https://vibefolio.net` or `http://localhost:3000`).

---

## 1. Projects API

### 1.1 List Projects

Fetch a paginated list of projects with optional filtering.

- **Endpoint:** `GET /api/projects`
- **Query Parameters:**
  - `page` (number, default: 1): The page number.
  - `limit` (number, default: 20): Number of items per page.
  - `category` (string, optional): Filter by genre slug (e.g., `animation`, `web-app`, `design`). Use `all` for no filter.
  - `field` (string, optional): Filter by field slug (e.g., `it`, `marketing`).
  - `search` (string, optional): Search query for title or content.
  - `userId` (string, optional): Filter by project owner's UUID.
- **Response:**
  ```json
  {
    "projects": [
      {
        "project_id": 123,
        "title": "Project Title",
        "content_text": "Description...",
        "thumbnail_url": "https://...",
        "views": 100,
        "likes": 50,
        "category_id": 1,
        "User": {
          "user_id": "uuid",
          "username": "nickname",
          "profile_image_url": "url"
        },
        "custom_data": {
          "genres": ["animation", "3d"],
          "fields": ["video", "art"]
        }
      }
      // ...
    ]
  }
  ```

### 1.2 Get Project Details

Fetch detailed information for a specific project.

- **Endpoint:** `GET /api/projects/[id]`
- **Response:**
  ```json
  {
    "project": {
      "project_id": 123
      // ... project details
    }
  }
  ```

### 1.3 Create Project

Create a new project.

- **Endpoint:** `POST /api/projects`
- **Headers:** `Authorization: Bearer <supabase_access_token>`
- **Body:**
  ```json
  {
    "title": "My New Project",
    "content_text": "Description...",
    "thumbnail_url": "url",
    "image_url": "url", // Optional
    "category_id": 1,
    "rendering_type": "IMAGE", // or "VIDEO" etc.
    "custom_data": {
      "genres": ["animation"],
      "fields": ["art"]
    }
  }
  ```

### 1.4 Update Project

Update an existing project.

- **Endpoint:** `PUT /api/projects/[id]`
- **Headers:** `Authorization: Bearer <supabase_access_token>`
- **Body:** (Fields to update)
  ```json
  {
    "title": "Updated Title",
    "category_id": 2, // Optional: Primary Genre ID
    "field": "it", // Optional: Primary Field Slug
    "custom_data": {
      "genres": ["animation", "3d"], // Multi-select genres
      "fields": ["it", "finance"] // Multi-select fields
    }
    // ... Any other fields
  }
  ```

### 1.5 Delete Project

Soft delete a project.

- **Endpoint:** `DELETE /api/projects/[id]`
- **Headers:** `Authorization: Bearer <supabase_access_token>`

---

## 2. Search API

### 2.1 Get Search Trends

Retrieve the top 10 trending search keywords.

- **Endpoint:** `GET /api/search/trends`
- **Response:**
  ```json
  {
    "trends": [
      { "query": "AI Art", "count": 150 },
      { "query": "Web Design", "count": 120 }
    ]
  }
  ```

### 2.2 Log Search Query

Log a user's search query for trend analysis.

- **Endpoint:** `POST /api/search/log`
- **Body:**
  ```json
  { "query": "Search Term" }
  ```

---

## 3. Notifications API (Realtime)

While notifications primarily use Supabase Realtime subscriptions, there are endpoints for managing them.

- **Listen for Notifications:**
  - Client subscribes to `postgres_changes` on the `notifications` table.
  - Channel: `notifications:<user_id>`
  - Event: `INSERT`

---

## 4. Admin API

### 4.1 Get Dashboard Stats

Fetch aggregated statistics for the admin dashboard.

- **Endpoint:** `GET /api/admin/stats`
- **Headers:** `Authorization: Bearer <admin_token>`

---

## 5. Other Endpoints

- **Users:** `/api/users/[id]` - Get public user profile.
- **Likes:** `/api/likes` (or handled via Supabase Client directly).
- **Comments:** `/api/comments` (or handled via Supabase Client directly).
