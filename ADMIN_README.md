# Admin Panel for Alpha Kappa Psi Family Trees

## Overview

The main site (`akpsi-family-trees-site`) is **read-only** - visitors can view family trees but cannot add or modify data. 

To add brothers to the database, use the **separate admin panel** (`admin.html`).

## Using the Admin Panel

### Accessing the Admin Panel

1. **Local Development:**
   - Open `admin.html` in your browser
   - Or serve it: `python -m http.server 8080` then visit `http://localhost:8080/admin.html`

2. **Production:**
   - Upload `admin.html` to your server (separate from the main site, or password-protected)
   - Or access it directly: `https://your-domain.com/admin.html`
   - **Important:** Keep this page private or password-protected!

### Setting the API URL

1. The admin panel needs to connect to your backend API
2. By default, it uses `/api` (same domain)
3. If your API is on a different server, change the API URL field at the top of the form
   - Example: `https://your-api-server.com/api`

### Adding a Brother

1. **Select Family** - Choose which family (EMPIRE, PRIDE, POWER, GREED, or WOLFPACK)
2. **Select Big Brother** - Choose a parent brother, or select "None" for a root node
3. **Fill in Details:**
   - Name (required)
   - Pledge Class (optional)
   - Graduation Year (optional)
   - Major (optional)
   - Career Aspirations (optional)
   - Fun Facts (optional)
   - Status (Studying or Graduated)
   - Transfer checkbox (optional)
4. **Enter Admin Password** - The same password used for login
5. **Click "Add Brother"**

### Features

- **Dynamic Brother List:** When you select a family, the dropdown loads all existing brothers for that family
- **Root Node Support:** Select "None" to create a brother with no parent (starts a new branch)
- **Relationship Creation:** Automatically creates the Big/Little relationship if a parent is selected
- **Success Feedback:** Shows confirmation with the new brother's ID

## Security Notes

- The admin panel requires the same password as the main site login
- Keep `admin.html` private - don't link to it from the public site
- Consider password-protecting the admin panel directory on your server
- Or host it on a completely separate server with restricted access

## Troubleshooting

### "Could not load existing brothers"
- Check that the API URL is correct
- Verify the backend server is running
- Check browser console for errors

### "Error: Invalid password"
- Make sure you're using the correct admin password
- Check that the PASSWORD environment variable is set correctly on the server

### Brothers not appearing on main site
- Wait a moment and refresh the main site
- Check server logs to verify the brother was created
- Use `server/check-db.js` to verify data in PostgreSQL

## File Structure

```
.
├── admin.html              # Standalone admin panel (NEW)
├── client/                 # Main read-only site
│   └── src/
│       └── components/
│           ├── TreeVisualization.jsx  # Read-only (add buttons removed)
│           └── BrotherDetailModal.jsx # Read-only (add little removed)
├── server/
│   ├── server.js          # Backend API
│   └── check-db.js         # Database verification script
└── ADMIN_README.md         # This file
```

## Future Enhancements

Consider adding:
- Multiple admin users with different permission levels
- Admin login system (separate from main site login)
- Admin dashboard showing statistics
- Bulk import from CSV
- Edit/delete functionality in admin panel

