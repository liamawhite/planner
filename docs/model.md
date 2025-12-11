# Planner Data Model

This document describes the core concepts and objects you'll work with in the Planner application.

## Core Concepts

Every object in Planner follows these principles:

- **Unique IDs**: Each item gets a unique identifier when created
- **Automatic Timestamps**: The system tracks when items are created and last updated
- **Name Limits**: Names are limited to 255 characters to keep things organized
- **Optional Descriptions**: Most items can have longer descriptions (up to 1000 characters) for additional context

## Area

An **Area** represents a logical area or category in your planning system. Use areas to organize and group related planning items - for example, "Work", "Personal", "Health", or "Learning".

### What's in an Area?

| Property | Description |
|----------|-------------|
| **Name** | The display name of your area (required, 1-255 characters) |
| **Description** | Additional context or notes about the area (optional, up to 1000 characters) |
| **ID** | A unique identifier automatically assigned when created |
| **Created** | When the area was first created (automatic) |
| **Last Updated** | When the area was last modified (automatic) |

### What can you do with Areas?

#### Create an Area

Add a new area to organize your planning items.

**What you provide:**
- A **name** for the area (required)
- An optional **description** for more context

**What you get back:**
- The new area with its unique ID and timestamps

**Example:**
```typescript
const area = await CreateArea("Personal", "Personal life and goals");
// Returns: { id: "...", name: "Personal", description: "Personal life and goals", ... }
```

**Rules:**
- Name must be at least 1 character and no more than 255
- Description can be empty or up to 1000 characters

---

#### Get an Area

Look up a specific area by its ID.

**What you provide:**
- The **ID** of the area you want to retrieve

**What you get back:**
- The complete area information

**Example:**
```typescript
const area = await GetArea("f47ac10b-58cc-4372-a567-0e02b2c3d479");
// Returns: { id: "...", name: "Personal", description: "...", ... }
```

**When it fails:**
- If the area doesn't exist, you'll get a "not found" error

---

#### List All Areas

Get all your areas at once.

**What you provide:**
- Nothing required

**What you get back:**
- A list of all your areas, newest first

**Example:**
```typescript
const areas = await ListAreas();
// Returns: [{ id: "...", name: "Work", ... }, { id: "...", name: "Personal", ... }]
```

**Notes:**
- Areas are returned newest first
- Returns an empty list if you haven't created any areas yet

---

#### Update an Area

Change the name or description of an existing area.

**What you provide:**
- The **ID** of the area to update
- A new **name** (optional)
- A new **description** (optional)

**What you get back:**
- The updated area with the new information

**Example:**
```typescript
const newName = "Work";
const newDescription = "Professional projects and tasks";
const updated = await UpdateArea(areaId, newName, newDescription);
```

**Rules:**
- You can update just the name, just the description, or both
- The same character limits apply (name: 1-255, description: 0-1000)
- The "Last Updated" timestamp will be automatically set to now

**When it fails:**
- If the area doesn't exist, you'll get a "not found" error

---

#### Delete an Area

Permanently remove an area.

**What you provide:**
- The **ID** of the area to delete

**What you get back:**
- Confirmation of deletion

**Example:**
```typescript
await DeleteArea(areaId);
```

**Important:**
- This permanently deletes the area
- Cannot be undone
- In the future, this may prevent deletion if the area contains other items

**When it fails:**
- If the area doesn't exist, you'll get a "not found" error

---

## Common Usage Patterns

### Setting up your planning structure

When you first start using Planner, you might create areas like:

```typescript
// Create main life areas
await CreateArea("Work", "Professional projects and career");
await CreateArea("Personal", "Personal life and self-improvement");
await CreateArea("Health", "Exercise, nutrition, and wellness");
await CreateArea("Learning", "Courses, books, and skill development");

// Get all areas to see your structure
const myAreas = await ListAreas();
```

### Renaming and reorganizing

As your needs change, you can update areas:

```typescript
// Rename an area
await UpdateArea(workAreaId, "Career", null);

// Add more context to an area
await UpdateArea(healthAreaId, null, "Gym 3x/week, meal prep on Sundays");

// Update both at once
await UpdateArea(learningAreaId, "Education", "Online courses and certifications");
```

### Cleaning up

Remove areas you no longer need:

```typescript
// Delete an area you're not using anymore
await DeleteArea(oldAreaId);
```

---

## Coming Soon

Planner will expand beyond Areas to include:

- **Tasks**: Individual action items you want to complete
- **Projects**: Collections of related tasks with goals and deadlines
- **Notes**: Quick thoughts and references associated with your planning items
- **Tags**: Cross-cutting labels to organize items beyond areas (e.g., "urgent", "someday")

Each of these will work together to help you organize your planning at whatever level of detail you need.
