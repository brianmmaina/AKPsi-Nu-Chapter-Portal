# AKPsi Family Tree

Internal tool for the Nu Chapter family tree and the new Live Points dashboard.

## Points Dashboard / VPAA Handoff

- **Source of truth:** `client/src/data/points.json`. Each timeframe (`SEMESTER`, `YEAR`) has `members`, `families`, and `events`. Member IDs must match the IDs from the family-tree backend so the leaderboard, modal, and tree view stay in sync.
- **Updating data:** Export the latest Google Sheet (or other tracker) to the JSON structure above, then replace the file. Hot reload will pick it up, or run the “Refresh data” button which clears the local cache (`PointsContext` calls `clearPointsDataCache` before refetching).
- **Point rules copy:** Edit `client/src/components/points/PointsRulesPanel.jsx`. Keep the tone celebratory and reiterate that fines / J-Board details never surface.
- **Categories & timeframes:** Category strings and the `getPointsData` contract live in `client/src/services/pointsService.ts`. Add new categories there (and style tags in `MemberPointsDetail.jsx`). Timeframe options are controlled by the `TimeframeSelector` buttons—add a new option, then teach the service how to load it.
- **Correction requests:** The inline form in `client/src/components/points/CorrectionRequestForm.jsx` currently opens an email to `vpaa@akpsi-nu.org`. Update the address or replace with an API call when a backend exists.
- **Future data source:** `getPointsData` is async and already isolated in `pointsService.ts`, so swapping to Google Sheets (or a small API) only requires touching that file—the UI just calls the function.

