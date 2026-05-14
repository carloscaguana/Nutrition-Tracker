# NutritionTracker Project

## Project Overview

NutriTrack is a web application for personal nutrition tracking. Users can log meals, track their macronutrient and calorie intake against personalized goals, monitor their body weight over time, browse a comprehensive food database, and save frequently-eaten foods as favorites. The application is designed around the principle of making daily nutrition logging as fast and frictionless as possible.

## Tech Stack

| Layer              | Technology                                 |
| ------------------ | ------------------------------------------ |
| Framework          | Next.js 16.2.2 (App Router)                |
| Language           | TypeScript                                 |
| UI Library         | React 19                                   |
| Styling            | Tailwind CSS v4 with CSS custom properties |
| Backend / Database | Supabase (PostgreSQL + Auth)               |
| Supabase Client    | @supabase/supabase-js                      |

Supabase was chosen as the backend because it provides a fully managed PostgreSQL database, a built-in authentication system (email/password and OAuth), and a type-safe JavaScript client that generates queries directly without needing a separate REST or GraphQL API layer. The Supabase client (createClient) is instantiated once in src/lib/supabase.ts and imported by every API module in the application. Row-level security (RLS) policies on the database enforce that each user can only read and write their own data, meaning the frontend never needs to manually filter by user_id in every query — Supabase handles it at the database level after authenticating the session token.

## Database Schema

The entire relational schema lives in Supabase PostgreSQL. The following is a list of the tables created for this project:

- `users` Table: Stores user profile information. The `user_id` is a UUID linked to Supabase Auth — when a user registers, Supabase Auth creates the auth record and a trigger populates this table automatically. Fields include `name`, `email`, `dob`, `height_cm`, `sex`, and `created_at`.
- `foods` Table: A static reference table containing the food database. Each row represents one food item with over 35 nutritional data points per 100g of food: `kcal_val`, `protein_g`, `carbs_g`, `fats_g`, `fiber_g`, `sugars_g`, `sat_fats_g`, `mono_fats_g`, `poly_fats_g`, `cholesterol_mg`, `sodium_g`, `water_g`, twelve vitamins (A, B1–B12, C, D, E, K), nine minerals (calcium, iron, magnesium, phosphorus, potassium, zinc, copper, manganese, selenium), and a computed `nutrition_density` score.
- `meals` Table: Each row represents a single meal logged by a user. Fields: `meal_id`, `user_id` (FK → users), `meal_type` (enum: breakfast, lunch, dinner, snack, drink, other), `time_consumed_at` (timestamp), `last_updated_at`.
- `meal_items` Table: A junction table linking a meal to one or more foods with quantities. Fields: `mealitem_id`, `meal_id` (FK → meals), `food_id` (FK → foods), `unit_id` (FK → serving_units, nullable), `quantity`, `quantity_grams`. The `quantity_grams` field stores the gram weight used to compute nutritional totals.
- `serving_units` Table: Initially created as a reference table for common serving unit labels (e.g. "cup", "slice", "tablespoon") that can optionally be attached to a meal item, but was not implemented due to complexity of conversion rates between grams to cups, tablespoon, etc. being reliant on density of the specific food. For example, the amount of grams in a cup of bananas is different than the amount of grams in a cup of oil.
- `favorite_foods` Table: A many-to-many join table between users and foods. Fields: `user_id` (FK → users), `food_id` (FK → foods), `added_at`. The composite key (`user_id`, `food_id`) ensures a user cannot favorite the same food twice.
- `goals` Table: Each row is a nutrition goal created by a user. Fields: `goal_id`, `user_id` (FK → users), `goal_type` (enum: deficit, maintenance, surplus, other), `calorie_target`, `protein_target`, `carb_target`, `fat_target`, `start_date`, `end_date`. The `end_date` column defaults to 9999-01-01 in the database as a sentinel value indicating the goal is ongoing.
- `weight_log` Table: Each row is a single weight entry. Fields: `weightlog_id`, `user_id` (FK → users), `weight_kg`, `recorded_at` (timestamp, defaults to `now()`).

## Authentication

**Implementation:** Supabase Auth handles registration and login. The useAuth hook (src/hooks/useAuth.ts) subscribes to supabase.auth.onAuthStateChange to reactively track the current session. It returns { user, loading }. Every protected page checks user on mount — if user is null after auth resolves, the page redirects to /login via useRouter().replace("/login").

The login page (src/app/login/page.tsx) calls supabase.auth.signInWithPassword() for existing users and supabase.auth.signUp() for registration. Supabase returns a session object containing the JWT access token, which the client library automatically attaches to every subsequent database request.

Sign-out is handled in the Navbar component, which calls supabase.auth.signOut() and redirects to the landing page.

## Features Built

### Dashboard (Home Page)

Gives the user an at-a-glance summary of their day — what they've eaten, how their macros compare to their goal, a preview of past meals, the current active goal, and their most recent weight.

What it does:

- Displays a time-aware greeting ("Good morning / afternoon / evening, [name]")
- Shows four macro summary cards: Calories, Protein, Carbs, Fat — each with the current day's running total, a progress bar showing percentage of the daily goal target, and the target value
- "Today's Meals" section lists every meal logged so far today, with meal type label, calories, and each food item with its gram weight and calories
- "Meal History" section below shows the last 10 meals across any date with date-group dividers; a "See all" pill button appears when the user has more than 10 total meals and links to the full history page
- "Active Goal" card (bottom right) links to `/goals` and shows the goal type and calorie/macro targets
- "Current Weight" card (bottom left) links to `/weight` and shows the most recent weight log with full date and time
- A floating green `+` action button always visible in the bottom-right corner for quick meal logging

### Navigation Bar

Persistent top-level navigation between all main sections of the app that facilitates page-to-page movement and enhances user experience.

What it does:

- Logo links to dashboard
- Desktop nav shows links to Dashboard, Foods, Goals, Weight, Favorites — the active link is highlighted in brand green by comparing `pathname` to each `href`
- "Sign out" button calls `supabase.auth.signOut()`
- Mobile responsive: links collapse into a hamburger menu
- When the user is not authenticated, shows marketing links (Features, How it works) and Sign in / Get started CTA buttons instead

### Meal Logging

Allow users to create a new meal entry by searching for foods, setting portions, and choosing a meal type.

What it does:

- Meal type selector (Breakfast, Lunch, Dinner, Snack, Drink, Other)
- Food search panel with a debounced text input that queries the foods table; results appear as clickable cards
- Added items appear in a staging list below; items can be removed before saving
- On save: creates a meal row, then inserts one `meal_items` row per food item

### Meal Editing After Saving

Allow users to modify a previously logged meal — changing which foods are included or their quantities.

What it does:

- Existing meal items load with their food names and quantities; removed items are visually struck through with an "Undo" button to restore them before saving
- New items (added in this edit session) appear with a green "new" badge
- On save: calls `updateMeal()` for metadata, `deleteMealItem()` for each removed item ID, and `addMealItem()` for each new item

### Meal History

A dedicated paginated page showing the user's complete meal log across all dates, not just today.

What it does:

- Meals grouped by date with date-divider headings
- Each meal card shows type, time, calorie count, and food items, with edit and delete buttons
- Paginated at 20 meals per page with Previous / Next controls.
- Empty state with a CTA to log the first meal

### Food Search Page

Let users browse and search the full food database to see detailed nutritional information for any food.

What it does:

- Debounced search bar (300ms delay) that filters by food name
- Each food row in the table shows name, calories, protein, carbs, fat, and fiber; clicking a row expands it to reveal a full nutrition panel organized into three groups: Macronutrients (12 fields), Minerals (9 fields), and Vitamins (12 fields)
- Rows-per-page selector: 10, 25, 50, 100, 250, 500
- Full pagination bar: First (⏮), Previous (‹), numbered page buttons with ellipsis for gaps, Next (›), Last (⏭)
- Active page shown in brand green; total entry count shown

### User Goals Page

Allow users to set personalized daily nutrition targets (calorie and macro goals) and automatically track which goal is currently active without manually managing dates.

What it does:

- Displays all goals as cards, with the current active goal highlighted with a "Current" green badge and past goals showing their end date
- Goal type selector with four options: Deficit, Maintenance, Surplus, Other
- Form fields: calorie target (required), protein, carbs, and fat targets (optional)
- No date fields in the form — dates are managed automatically:
- When a new goal is created, start_date is set to today (using local timezone, not UTC) and end_date is set to 9999-01-01 (the sentinel for "ongoing")
- When a new goal is created while one already exists, the previous active goal is automatically closed by setting its end_date to yesterday
- Edit: updates only the macro/calorie targets, never touches dates
- Delete: removes the goal row entirely

### Weight Tracking

Allow users to log their body weight over time and review their history.

What it does:

- Log form: weight (kg) number input and a datetime-local input that defaults to the current date and time in the user's local timezone (not UTC)
- History table: shows all weight entries ordered most-recent first; the top entry has a "Latest" green badge; each row shows weight in bold and the full formatted date and time
- Inline editing: clicking Edit on any row replaces it with an editable row pre-filled with the existing values; saving calls the update API; Cancel restores the display row
- Delete with a confirmation dialog
- The dashboard "Current Weight" card is a clickable link to `/weight`, showing the most recent weight and full timestamp

### Favorite Foods

Let users save foods they eat regularly so they can find them quickly without searching every time.

What it does:

- My Favorites: Displays the user's saved foods at the top in an expandable table (same collapsible nutrition detail panel as the Food Database page). Each row has a filled red heart button to remove the food. Shows an empty state with instructions when no favorites exist yet. A count badge next to the section heading shows how many foods are saved.
- Food Database: A full searchable, paginated food table (same rows-per-page options and numbered pagination as the Foods page). Each row has a heart toggle button — empty outline when not favorited, filled red when favorited. Clicking the heart immediately and optimistically updates both the favorites list at the top and the heart state in the search results without a page reload.
