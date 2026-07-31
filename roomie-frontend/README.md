# RoomieMA — frontend

React 19 + Vite + Tailwind v4. Talks to the FastAPI backend in
`../rommie-backend`.

```bash
npm install
cp .env.example .env
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

## Structure

```
src/
  components/
    ui/          Button, Input, Card, Badge, Modal, Toast, Avatar, Feedback
    layout/      Navbar, Footer, AppLayout, Logo, ScrollToTop
  core/
    api/         axios client (auth + refresh interceptors) and endpoints
    config/      constants and env-backed settings
    websocket/   chat socket with reconnection
  context/       AuthContext, NotificationContext
  features/      listings, applications, meetings, chat — mirrors the backend
  hooks/         useAsync, useDebounce, useModal, useListingMeta
  pages/         thin route components composing features
  routes/        AppRoutes, ProtectedRoute / GuestRoute
  utils/         formatters, storage
```

## Design system (Jari)

Tokens live in `src/index.css` under `@theme`, so Tailwind utilities like
`bg-terracotta`, `text-ink-soft` and `border-tan` come straight from the brand
palette:

| Token        | Value     | Use                     |
| ------------ | --------- | ----------------------- |
| `terracotta` | `#C85A17` | CTAs, headings, accents |
| `ochre`      | `#A58863` | Supporting elements     |
| `sage`       | `#6B8E6F` | Success states          |
| `ink`        | `#3D2817` | Primary text            |
| `ink-soft`   | `#5A4A3A` | Secondary text          |
| `cream`      | `#F5EBE0` | Page background         |
| `shell`      | `#FDF8F3` | Cards, light fills      |
| `tan`        | `#DCC5B5` | Borders, dividers       |

Display type is Georgia; body is the system sans stack. The `.zellige` class
paints a repeating geometric motif at 3% opacity for section backdrops, and
`CrescentAccent` draws a crescent-and-star at low opacity.

## Environment

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
```
