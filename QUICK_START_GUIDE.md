# Quick Start Guide - Adding Brothers to EMPIRE Family Tree

## 🚀 Getting Started

### Prerequisites
1. **Server is running**: Make sure your backend server is running
2. **Database initialized**: The database should auto-initialize on first server start
3. **Frontend running**: Make sure your React app is running

## 📝 Step-by-Step: Adding Your First Brothers

### Step 1: Access the EMPIRE Family Tree

1. **Login** → Enter your password
2. **Select EMPIRE** → Click the EMPIRE family card
3. You should see either:
   - Empty state: "This family tree is empty. Add the first brother to get started!"
   - OR existing brothers in a tree layout

### Step 2: Add Root Nodes (Start Nodes)

Based on your chart, you need to add multiple root nodes first:

#### Method 1: Using the Floating Button (Recommended)
1. **Click the "+ Add Root Node" button** (top-right corner, gold/theme-colored)
2. **Fill out the form**:
   - **Name**: Enter the brother's name (e.g., "Kelly Yu")
   - **Pledge Class**: (Optional) Enter pledge class (e.g., "CHI", "OMEGA")
   - **Graduation Year**: (Optional) Enter year (e.g., "2023")
   - **Major**: (Optional) Enter major
   - **Career Aspirations**: (Optional)
   - **Fun Facts**: (Optional)
   - **Status**: Select "Currently Studying" or "Graduated"
   - **Transfer?**: Check if they transferred
   - **Password**: Enter your admin password
3. **Click "Add Brother"**
4. **Important**: Don't select a "Big Brother" - this makes it a root node!

#### Method 2: Using Empty State Button (If tree is empty)
1. If tree is empty, click **"Add First Brother"**
2. Fill out the same form (no big brother = root node)
3. Submit

### Step 3: Add More Root Nodes

Repeat Step 2 for each root node:
- **Kelly Yu** (root node)
- **Jason Cooper** (root node) 
- **Sofi Dipilla** (root node)
- **Joey Yap** (root node)
- **Eileen Lee** (root node)
- **Julia Ha** (root node)
- **Jamie Phan** (root node)
- **Cat Cao** (root node)

All of these should be added as **root nodes** (no big brother).

### Step 4: Add Littles (Children of Root Nodes)

Once you have root nodes, add their littles:

#### Example: Add Joseph Tang (Little of Kelly Yu)

1. **Click on "Kelly Yu" node** → Opens brother detail modal
2. **Click "Add Little" button** in the modal
3. **Fill out the form**:
   - Name: "Joseph Tang"
   - Pledge Class: "AA" (or appropriate)
   - Other fields as needed
   - Password: Enter your admin password
4. **Notice**: The form shows "Adding as Little of: Kelly Yu" at the top
5. **Click "Add Brother"**
6. **Result**: Joseph Tang appears below Kelly Yu with a connecting line

#### Example: Add Bente Backer (Little of Jason Cooper)

1. **Click on "Jason Cooper" node**
2. **Click "Add Little"**
3. **Fill form** → Name: "Bente Backer", Pledge Class: "AA"
4. **Submit**

### Step 5: Add Complex Relationships

#### Example: Add Jasmine Fanchu Zhou (Little of BOTH Joseph Tang AND Bente Backer)

For brothers with multiple bigs (like in your chart):
- **Current limitation**: The system supports one `big_id` per brother
- **Workaround**: Add Jasmine as little of one (e.g., Joseph Tang), then note in fun_facts that Bente is also a big

**OR** you can add Jasmine as:
1. Little of Joseph Tang
2. Later, manually edit to show relationship note

### Step 6: Continue Building the Tree

Keep adding:
- **Root nodes** → Use "+ Add Root Node" button
- **Littles** → Click any node → "Add Little"

The tree will automatically:
- ✅ Layout all root nodes at Level 0 (top)
- ✅ Connect littles below their big brothers
- ✅ Space everything correctly
- ✅ Show all EMPIRE styling (gold accents, white boxes, etc.)

## 🎯 Tips

1. **Start with all root nodes first** - Get your top-level brothers in place
2. **Then add generations** - Add Level 1 (direct littles), then Level 2, etc.
3. **Use pledge class** - Helps identify levels/generations (CHI, OMEGA, AA, AB, AG, AD, etc.)
4. **Fill optional fields** - The EMPIRE nodes show pledge class, graduation year, major
5. **Save frequently** - Data saves immediately to SQLite database

## 🐛 Troubleshooting

### "Add Root Node" button not visible?
- Make sure you're on a family tree view (not login/selection page)
- Check browser console for errors
- Refresh the page

### Node not appearing?
- Check if password was correct
- Verify network request succeeded (check browser DevTools Network tab)
- Refresh the page manually

### Wrong position in tree?
- Root nodes always go to Level 0 (top)
- Littles go one level below their big
- Tree auto-refreshes after adding

## 📊 Example Workflow

```
1. Add Kelly Yu (root) → Click "+ Add Root Node"
2. Add Jason Cooper (root) → Click "+ Add Root Node"
3. Add Sofi Dipilla (root) → Click "+ Add Root Node"
4. Add Joseph Tang (little of Kelly) → Click Kelly → "Add Little"
5. Add Bente Backer (little of Jason) → Click Jason → "Add Little"
6. Add Jasmine Fanchu Zhou (little of Joseph) → Click Joseph → "Add Little"
... and so on
```

## 🗄️ Viewing Your Data

All data is saved in `server/database.sqlite`. You can:
- Query it with SQLite tools
- Backup the file
- It persists between server restarts

---

**Ready to start?** Go to the EMPIRE family tree and click **"+ Add Root Node"**! 🚀

