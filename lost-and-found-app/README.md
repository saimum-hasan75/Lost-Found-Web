# Pinboard — Lost & Found Web App

A full-stack "lost and found" board built with **React**, **Node.js**,
**Express.js**, and **MySQL** — matching the stack from your React,
Node/Express, and MySQL lecture slides.

People can pin a post for something they **lost** or something they
**found**, browse/search/filter the board, open a post to see contact
details, and mark a post **resolved** once the item is reunited with its
owner. No login system — kept intentionally simple so it maps cleanly to
what's usually covered in an intro full-stack course (CRUD API + React
frontend + MySQL storage).

```
lost-and-found-app/
├── backend/                 Express + MySQL REST API
│   ├── config/db.js          MySQL connection pool
│   ├── controllers/          Route handler logic (CRUD)
│   ├── routes/items.js       API routes
│   ├── database/schema.sql   Table + sample data
│   ├── server.js             App entry point
│   ├── package.json
│   └── .env.example          Copy to .env and fill in your DB creds
│
└── frontend/                 React app (Create React App)
    ├── public/index.html
    └── src/
        ├── api.js            fetch() wrapper for the backend API
        ├── App.jsx            Top-level view/state
        ├── App.css            Corkboard-themed styling
        └── components/
            ├── Navbar.jsx
            ├── Filters.jsx
            ├── ItemGrid.jsx
            ├── ItemCard.jsx
            ├── ItemForm.jsx
            ├── ItemModal.jsx
            └── Footer.jsx
```

## 1. Set up the database

1. Make sure MySQL is running locally.
2. Run the schema file — it creates the database, the `items` table, and
   a few sample posts:

   ```bash
   mysql -u root -p < backend/database/schema.sql
   ```

## 2. Run the backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your MySQL username/password
npm run dev        # or: npm start
```

The API starts on **http://localhost:5000**. Quick check:
`GET http://localhost:5000/` should return a small JSON status message.

### API reference

| Method | Route                      | Description                          |
|--------|-----------------------------|---------------------------------------|
| GET    | `/api/items`                 | List items. Query params: `type` (`lost`/`found`), `category`, `status` (`open`/`resolved`), `search` |
| GET    | `/api/items/:id`             | Get one item |
| POST   | `/api/items`                 | Create a post |
| PUT    | `/api/items/:id`             | Update a post's details |
| PATCH  | `/api/items/:id/status`      | Mark a post `open` or `resolved` |
| DELETE | `/api/items/:id`             | Delete a post |
| GET    | `/api/items/categories`      | List available categories |

## 3. Run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm start
```

The app opens on **http://localhost:3000** and talks to the API at
`http://localhost:5000/api` by default. To point it somewhere else,
create `frontend/.env` with:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## What each layer is doing (mapped to the lecture topics)

- **React (frontend)** — component-driven UI: `App.jsx` holds view state
  (`board` / `report-lost` / `report-found`) and passes data down as
  props; `useState`/`useEffect` handle filtering, fetching, and modals.
- **Node.js + Express (backend)** — a REST API (`server.js`, `routes/`,
  `controllers/`) exposing CRUD endpoints over HTTP, with `cors` and
  `express.json()` middleware.
- **MySQL** — persistent storage via the `mysql2` package's promise
  pool (`config/db.js`), parameterized queries to prevent SQL
  injection, and a schema with indexes on the columns used for
  filtering.

## Ideas to extend it (good for a follow-up assignment)

- Add image upload (multer + storing files) instead of an image URL field.
- Add simple authentication so only the original poster can resolve/delete a post.
- Add pagination to `GET /api/items` once the board has many posts.
- Add email notifications when a "found" post matches keywords from an open "lost" post.
