# PBS Karachi transit explorer

## Run locally

Requires Node 22.12+ and npm. Use two terminals from the project directory.

Terminal 1 (backend):
```sh
cd server
npm ci
npm start
```

Terminal 2 (frontend):
```sh
cd client
npm ci
npm run dev
```

Open http://localhost:5173. Keep both terminals running; Ctrl+C stops each process.
Dependency installation is only needed on first setup or after dependencies change.
The frontend forwards `/api` and `/socket.io` requests to the backend on port
4000, including live tracking WebSocket connections. No environment variables
are needed for local startup. For a production build served locally, run
`npm run build` and `npm run preview` in `client`, with the backend still running.
`VITE_API_URL` can override the API origin for separately configured deployments.

## R1 route

The complete displayed corridor is Khokhrapar–Saudabad–Model Colony–Dockyard,
with 44 published stops. Sources: [SMTA route directory](https://smta.gos.pk/routes/1)
and [Mnzil stop locations](https://mnzil.app/vehicles/R-01).

`server/data/route1-road.json` stores a 30.4 km OSM road reconstruction from
OSRM, routed through corridor anchors with travel-direction constraints.
It loads locally without requesting a deleted OSM way or a routing service.
Refresh with `node data/computeRoute.js` from `server`, then review the geometry.
The refresh rejects an unexpected distance or stops more than 250 metres away.
Stop markers preserve the published Mnzil coordinates. Only simulation stops
project onto road segments; passenger stop locations are never moved onto the
route line. Select a stop on the map or in the stop list to see its name,
and coordinates. External map/source links are omitted from the stop popup.

The route is reconstructed from published stops and OSM roads, not an operator
GPS trace. Both simulated directions share corridor geometry; separate inbound
and outbound carriageways are not modelled. Fleet positions and ETAs are demo
data. Current SMTA listings call this corridor Route 01 / Pink Bus and extend it
to Khokhrapar; older Red Bus R1 listings start at Model Colony.

Map tiles use OpenStreetMap. Contributor attribution remains visible; the
optional Leaflet library credit is removed. The UI includes fleet direction
filters, selectable buses and stops, and a full-route recenter control.

## Validation

From `client`: `npm run build` and `npm run lint`.

## Karachi route directory and directions

The route picker contains 20 SMTA directory entries (R1–R14, EV1–EV5, DD01).
Routes with downloaded stop data preserve the published coordinates; R5–R8
currently show an area directory because usable stop coordinates were not found.
R5–R7 are listed as inactive. Other road lines are reconstructions and can differ
from the operator's exact turns and official route distance. R12 and EV3 show
notes explaining the published stop variants. Generate additional road data
with `node data/routes/buildRoads.js`; review any resulting geometry.

Tracking opens only after choosing a route. UP travels from the listed city-side
terminal toward the outer terminal; DOWN travels toward the city-side terminal.
The UI always displays the actual mapped terminal pair. For R1, UP is Dockyard
→ Khokhrapar and DOWN is Khokhrapar → Dockyard. Both filters affect the map
and fleet list. Reverse published EV5/R13 listings are normalized before use.

## Performance, errors, and local security

The map loads on demand. Route details are cached in the browser, socket
subscriptions are scoped to the selected route, and fleet updates stop when
tracking closes. Simulation positions use a binary search over road segments.

The app includes request timeouts, retry controls, connection states, map-tile
failure handling, and a rendering error boundary. API errors do not expose
stack traces. The local API binds to loopback by default, validates route IDs,
limits HTTP requests and route subscriptions, restricts browser origins, caps
socket message sizes, and sends security headers. `CLIENT_URL` must be a plain
HTTP(S) origin. The dev frontend allows Vite's startup scripts with a fresh CSP
nonce on each HTML response. Build/preview keeps its strict script policy.

Development currently requires Node 22.12+ (Vite). Node's built-in watcher
replaces nodemon. Unused XML/routing packages were removed. Both dependency
audits reported zero vulnerabilities after compatible fixes on 2026-10-06.

Run backend checks with `npm test` from `server`; run `npm run build` and
`npm run lint` from `client`. Public route data does not require an account;
this prototype does not provide authenticated operator telemetry.
