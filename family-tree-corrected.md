# CORRECTED Family Tree Design Specifications
## Based on Actual PDF Page Analysis

### Color Reference Summary

| Family | Background | Primary Text | Secondary Text | Accent Elements |
|--------|------------|--------------|-----------------|-----------------|
| **EMPIRE** | #f8f7f3 (cream) | #c9a857 (gold) | #1f1f1f (black) | Gold crown, tan lines |
| **POWER** | #101a26 (dark navy) | #ebd290 (champagne gold) | #ffffff (white) | Gold hexagons, lightning bolt |
| **GREED FAM** | #095332 (forest green) | #f4d961 (golden yellow) | #ffffff (white) | Yellow crown, white lines |
| **WOLFPACK** | #364c73 (slate blue) | #ffffff (white) | #ffffff (white) | Navy headers, gray wolf |
| **PRIDE** | #181413 (dark brown/black) | #d4af7e (muted gold) | #ffffff (white) | Gold borders, ornaments, lion |

---

## 1. EMPIRE FAMILY - "Building Our Empire" 👑

### Color Palette (ACTUAL)

```css
/* Background */
--empire-bg: #f8f7f3;              /* Warm cream/off-white */
--empire-bg-light: #fafaf8;        /* Lighter variant */
--empire-bg-secondary: #f0efeb;    /* Slightly darker */

/* Primary Text / Titles */
--empire-primary: #c9a857;         /* Warm gold/tan */
--empire-primary-dark: #b39440;    /* Darker gold */
--empire-primary-light: #dbb970;   /* Lighter gold */

/* Secondary Text */
--empire-text: #1f1f1f;            /* Very dark gray/black */
--empire-text-secondary: #666666;  /* Medium gray */
--empire-text-tertiary: #999999;   /* Light gray */

/* Accent Elements */
--empire-accent-lines: #4a4a4a;    /* Dark gray for connecting lines */
--empire-accent-border: #d4c9b3;   /* Tan border color */
--empire-white: #ffffff;           /* For cards and boxes */
```

### Typography

```
TITLE: "EMPIRE FAMILY"
- Font: Serif (Georgia, Playfair Display)
- Size: 48-60px
- Weight: Bold (700)
- Color: #c9a857
- Letter-spacing: 2px
- Transform: UPPERCASE
- Style: Classic, elegant

SUBTITLE: "building our empire"
- Font: Serif, light weight
- Size: 14-16px
- Weight: Regular (400)
- Color: #c9a857
- Style: Italic, lowercase
- Letter-spacing: 1px

MEMBER NAMES:
- Font: Sans-serif (Calibri, Arial)
- Size: 10-11px
- Weight: Regular (400)
- Color: #1f1f1f
- Transform: Title Case

GREEK LETTERS:
- Font: Sans-serif
- Size: 9-10px
- Weight: Regular (400)
- Color: #c9a857
- Transform: UPPERCASE
- Letter-spacing: 0.5px
```

### Layout

- **Structure:** Hierarchical family tree with Greek letter designations on left
- **Connecting Lines:** Dark gray vertical and horizontal lines (#4a4a4a)
- **Cards:** White boxes with subtle borders for individual members
- **Photos:** Included on right side in small thumbnail format
- **Decorative Elements:** Crown icon in title, small emoji/icons at bottom

### Design Details

```css
.empire-header {
  background: linear-gradient(180deg, #f8f7f3 0%, #f0efeb 100%);
  border-bottom: 3px solid #c9a857;
  padding: 40px 20px;
  text-align: center;
}

.empire-crown-icon {
  width: 40px;
  height: 40px;
  display: inline-block;
  margin-left: 15px;
  color: #c9a857;
  font-size: 40px;
}

.empire-greek-letter {
  color: #c9a857;
  font-size: 10px;
  font-weight: regular;
  letter-spacing: 0.5px;
}

.empire-connector-line {
  stroke: #4a4a4a;
  stroke-width: 2px;
}

.empire-member-box {
  background: #ffffff;
  border: 1px solid #d4c9b3;
  border-radius: 2px;
  padding: 8px 12px;
}
```

---

## 2. POWER - "Established 2007, Revived 2023" ⚡

### Color Palette (ACTUAL)

```css
/* Background */
--power-bg: #101a26;               /* Very dark navy/charcoal */
--power-bg-light: #1a2635;         /* Slightly lighter */
--power-bg-secondary: #0d151f;     /* Darker variant */

/* Primary Text / Titles */
--power-primary: #ebd290;          /* Champagne gold */
--power-primary-dark: #d4985f;     /* Darker gold */
--power-primary-light: #f5dfa8;    /* Lighter champagne */

/* Secondary Text */
--power-text: #ffffff;             /* White */
--power-text-secondary: #e0e0e0;   /* Light gray */

/* Accent Elements */
--power-accent-hexagon: #ebd290;   /* Gold hexagon borders */
--power-accent-lightning: #ebd290; /* Gold lightning bolt */
--power-accent-logo: #ebd290;      /* Gold P logo */
```

### Typography

```
TITLE: "POWER"
- Font: Serif (Georgia, Playfair Display) OR Sans-serif bold
- Size: 56-72px
- Weight: Bold (700)
- Color: #ebd290
- Letter-spacing: 3px
- Transform: UPPERCASE
- Style: Elegant, powerful

SUBTITLE: "ESTABLISHED IN 2007" / "REVIVED IN 2023"
- Font: Sans-serif (Arial, Calibri)
- Size: 14-16px
- Weight: Regular (400)
- Color: #ffffff
- Transform: UPPERCASE
- Letter-spacing: 1px

TAGLINE: "Oldest and Newest Family"
- Font: Sans-serif
- Size: 12px
- Weight: Regular (400)
- Color: #ffffff
- Transform: Title Case
- Style: Italic

MEMBER NAMES:
- Font: Sans-serif
- Size: 11-12px
- Weight: Regular (400)
- Color: #ffffff
- Transform: Title Case

GREEK LETTERS:
- Font: Sans-serif
- Size: 10-11px
- Weight: Regular (400)
- Color: #ebd290
- Transform: Title Case
- Letter-spacing: 0.5px

TRANSFER LABEL:
- Font: Sans-serif
- Size: 9px
- Weight: Regular (400)
- Color: #999999
- Style: Italic
```

### Layout

- **Structure:** Hexagonal boxes containing member information
- **Background:** Dark navy with gradual gradient
- **Connecting Lines:** Gold lines showing relationships
- **Graphic Elements:** Large gold lightning bolt in top right, "P" logo
- **Hexagon Border:** Gold (#ebd290) 3-4px stroke

### Design Details

```css
.power-header {
  background: linear-gradient(135deg, #101a26 0%, #0d151f 100%);
  position: relative;
  overflow: hidden;
  padding: 60px 40px;
}

.power-lightning-bolt {
  position: absolute;
  top: 20px;
  right: 60px;
  width: 200px;
  height: 200px;
  fill: #ebd290;
  opacity: 0.8;
}

.power-p-logo {
  position: absolute;
  top: 30px;
  right: 20px;
  font-size: 80px;
  color: #ebd290;
  font-weight: bold;
}

.power-hexagon {
  shape: hexagon;
  border: 3px solid #ebd290;
  background: transparent;
  padding: 15px;
  text-align: center;
}

.power-connector-line {
  stroke: #ebd290;
  stroke-width: 2px;
}

.power-member-text {
  color: #ffffff;
  text-align: center;
  line-height: 1.4;
}

.power-greek-letter-text {
  color: #ebd290;
  font-size: 10px;
  margin-top: 4px;
}
```

---

## 3. GREED FAM - "Family Tree 2025" 👑

### Color Palette (ACTUAL)

```css
/* Background */
--greed-bg: #095332;               /* Deep forest green */
--greed-bg-light: #0d6b40;         /* Slightly lighter */
--greed-bg-secondary: #073d26;     /* Darker variant */

/* Primary Text / Titles */
--greed-primary: #f4d961;          /* Golden yellow */
--greed-primary-dark: #d4b635;     /* Darker yellow */
--greed-primary-light: #fce89a;    /* Lighter yellow */

/* Secondary Text */
--greed-text: #ffffff;             /* White */
--greed-text-secondary: #e0e0e0;   /* Light gray */

/* Accent Elements */
--greed-accent-crown: #f4d961;     /* Yellow crown */
--greed-accent-lines: #ffffff;     /* White connector lines */
--greed-accent-boxes: #ffffff;     /* White name boxes */
```

### Typography

```
TITLE: "GREED FAM"
- Font: Sans-serif heavy (Arial Black, Futura Black)
- Size: 52-64px
- Weight: Black (900) or Extra Bold (800)
- Color: #f4d961
- Letter-spacing: 2px
- Transform: UPPERCASE
- Style: Bold, modern

SUBTITLE: "FAMILY TREE 2025"
- Font: Sans-serif
- Size: 16-20px
- Weight: Bold (700)
- Color: #f4d961
- Transform: UPPERCASE
- Letter-spacing: 1.5px

MEMBER NAMES:
- Font: Sans-serif (Arial, Calibri)
- Size: 10-11px
- Weight: Regular (400)
- Color: #333333 (dark text on white boxes)
- Transform: UPPERCASE

MEMBER BOX TEXT:
- Background: #ffffff (white)
- Padding: 8px 12px
- Border: 1px solid #e0e0e0
- Border-radius: 0px (crisp corners)
```

### Layout

- **Structure:** Hierarchical tree with white boxes on green background
- **Background:** Solid deep forest green (#095332)
- **Member Boxes:** White rectangular boxes with dark text
- **Connecting Lines:** White lines connecting members
- **Decorative:** Yellow crown icon in top left corner
- **Organization:** Multiple levels showing generations/classes

### Design Details

```css
.greed-header {
  background: linear-gradient(135deg, #095332 0%, #073d26 100%);
  padding: 50px 40px;
  position: relative;
}

.greed-crown-icon {
  position: absolute;
  top: 20px;
  left: 30px;
  font-size: 45px;
  color: #f4d961;
}

.greed-title {
  color: #f4d961;
  font-size: 56px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.greed-subtitle {
  color: #f4d961;
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.greed-member-box {
  background: #ffffff;
  border: 1px solid #d0d0d0;
  padding: 8px 12px;
  text-align: center;
  font-size: 10px;
  font-weight: 400;
  color: #333333;
}

.greed-connector-line {
  stroke: #ffffff;
  stroke-width: 2px;
}

.greed-background {
  background: #095332;
}
```

---

## 4. WOLFPACK - "Fam Tree 2025" 🐺

### Color Palette (ACTUAL)

```css
/* Background */
--wolfpack-bg: #364c73;            /* Slate/dusty blue */
--wolfpack-bg-light: #3f5580;      /* Slightly lighter */
--wolfpack-bg-secondary: #2a3a5c;  /* Darker variant */

/* Primary Text / Titles */
--wolfpack-primary: #ffffff;       /* White */
--wolfpack-primary-dark: #e0e0e0;  /* Light gray */
--wolfpack-primary-light: #f5f5f5; /* Very light gray */

/* Secondary Text */
--wolfpack-text: #ffffff;          /* White */
--wolfpack-text-secondary: #3d5373;/* Darker blue-gray */

/* Accent Elements */
--wolfpack-accent-boxes: #ffffff;  /* White member boxes */
--wolfpack-accent-headers: #3d5373;/* Dark blue header bars */
--wolfpack-accent-wolf: #888888;   /* Gray wolf silhouette */
```

### Typography

```
TITLE: "WOLFPACK"
- Font: Sans-serif heavy (Arial Black, Futura)
- Size: 54-68px
- Weight: Black (900) or Extra Bold (800)
- Color: #ffffff
- Letter-spacing: 2px
- Transform: UPPERCASE
- Style: Bold, aggressive

SUBTITLE: "FAM TREE 2025"
- Font: Sans-serif
- Size: 14-18px
- Weight: Regular (400)
- Color: #ffffff
- Transform: UPPERCASE
- Letter-spacing: 1px

MEMBER NAMES:
- Font: Sans-serif (Arial, Calibri)
- Size: 10-12px
- Weight: Regular (400)
- Color: #3d5373 (dark blue)
- Transform: Title Case / UPPERCASE

MEMBER BOX:
- Background: #ffffff (white)
- Header bar: #3d5373 (dark blue)
- Padding: 10px 12px
- Border-radius: 0px
```

### Layout

- **Structure:** Tree-style family hierarchy with white boxes
- **Background:** Solid slate blue (#364c73)
- **Member Boxes:** White boxes with dark blue header bars
- **Connecting Lines:** Blue lines (#364c73) or white outline
- **Graphic Element:** Gray wolf silhouette in bottom left
- **Organization:** Multiple generations/classes

### Design Details

```css
.wolfpack-header {
  background: linear-gradient(180deg, #364c73 0%, #2a3a5c 100%);
  padding: 60px 40px;
  position: relative;
}

.wolfpack-title {
  color: #ffffff;
  font-size: 60px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 15px;
  font-family: 'Arial Black', sans-serif;
}

.wolfpack-subtitle {
  color: #ffffff;
  font-size: 16px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.wolfpack-wolf-silhouette {
  position: absolute;
  bottom: 0;
  left: 20px;
  width: 200px;
  height: 200px;
  opacity: 0.6;
  fill: #888888;
}

.wolfpack-member-box {
  background: #ffffff;
  border: 1px solid #d0d0d0;
  border-radius: 0;
}

.wolfpack-member-header {
  background: #3d5373;
  color: #ffffff;
  padding: 6px 10px;
  font-weight: 600;
  font-size: 10px;
  text-align: center;
  text-transform: uppercase;
}

.wolfpack-member-content {
  padding: 8px 10px;
  color: #3d5373;
  font-size: 10px;
  text-align: center;
}

.wolfpack-connector-line {
  stroke: #364c73;
  stroke-width: 2px;
}

.wolfpack-background {
  background: #364c73;
}
```

---

## 5. PRIDE FAMILY - Photo-Based Design 👑

### Color Palette (ACTUAL)

```css
/* Background */
--pride-bg: #181413;               /* Very dark brown/black */
--pride-bg-light: #242220;         /* Slightly lighter */
--pride-bg-secondary: #0f0e0c;     /* Darker variant */

/* Primary Text / Titles */
--pride-primary: #d4af7e;          /* Muted gold */
--pride-primary-dark: #b8905f;     /* Darker gold */
--pride-primary-light: #e8c9a0;    /* Lighter gold */

/* Secondary Text */
--pride-text: #ffffff;             /* White */
--pride-text-secondary: #e0e0e0;   /* Light gray */

/* Accent Elements */
--pride-accent-border: #d4af7e;    /* Gold border frame */
--pride-accent-ornaments: #d4af7e; /* Gold flourishes */
--pride-accent-lines: #d4af7e;     /* Gold connector lines */
```

### Typography

```
TITLE: "PRIDE" (left) / "FAMILY" (right)
- Font: Serif (Georgia, Playfair Display)
- Size: 48-60px
- Weight: Regular (400)
- Color: #d4af7e
- Letter-spacing: 2px
- Transform: UPPERCASE
- Style: Elegant, sophisticated

DECORATIVE ELEMENT:
- Ornamental crown/flourish between titles
- Color: #d4af7e
- Style: Classic heraldic design

MEMBER NAMES:
- Font: Sans-serif (Arial, Calibri)
- Size: 10-11px
- Weight: Regular (400)
- Color: #ffffff
- Transform: UPPERCASE

PHOTO FRAMES:
- Shape: Rectangle with labels below
- Border: None (photos are direct)
- Label style: Clean, centered under photo
```

### Layout

- **Structure:** Multi-generational tree with photos of members
- **Background:** Very dark brown/black (#181413)
- **Frame:** Large gold border surrounding entire tree (#d4af7e)
- **Decorative:** Gold ornamental flourishes at top and bottom
- **Photos:** Actual member photos arranged hierarchically
- **Text:** White text labels below each photo
- **Ornaments:** Gold decorative elements at corners

### Design Details

```css
.pride-header {
  background: #181413;
  padding: 40px;
  text-align: center;
  position: relative;
  border-top: 3px solid #d4af7e;
  border-bottom: 3px solid #d4af7e;
}

.pride-title-left {
  color: #d4af7e;
  font-size: 54px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 2px;
  display: inline-block;
  margin-right: 20px;
}

.pride-ornament-center {
  color: #d4af7e;
  font-size: 36px;
  display: inline-block;
  margin: 0 20px;
}

.pride-title-right {
  color: #ffffff;
  font-size: 54px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 2px;
  display: inline-block;
  margin-left: 20px;
}

.pride-container {
  background: #181413;
  border: 4px solid #d4af7e;
  padding: 30px;
  position: relative;
  margin: 20px;
}

.pride-ornament-corner {
  position: absolute;
  color: #d4af7e;
  font-size: 24px;
  opacity: 0.7;
}

.pride-ornament-top-left {
  top: 10px;
  left: 10px;
}

.pride-ornament-top-right {
  top: 10px;
  right: 10px;
}

.pride-ornament-bottom-left {
  bottom: 10px;
  left: 10px;
}

.pride-ornament-bottom-right {
  bottom: 10px;
  right: 10px;
}

.pride-member-photo {
  width: 80px;
  height: 80px;
  border-radius: 0;
  border: 1px solid #d4af7e;
  object-fit: cover;
}

.pride-member-name {
  color: #ffffff;
  font-size: 10px;
  margin-top: 8px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pride-connector-line {
  stroke: #d4af7e;
  stroke-width: 1.5px;
}

.pride-background {
  background: #181413;
}

.pride-footer-ornament {
  text-align: center;
  color: #d4af7e;
  font-size: 28px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #d4af7e;
}
```

---

## Global Implementation Notes

### For All Families

1. **Background Colors:**
   - Empire: Light cream (#f8f7f3)
   - Power: Dark navy (#101a26)
   - Greed: Deep green (#095332)
   - Wolfpack: Slate blue (#364c73)
   - Pride: Very dark brown (#181413)

2. **Text Hierarchy:**
   - Titles: 48-72px, primary color
   - Member names: 10-12px, secondary color
   - Designations: 9-10px, accent color

3. **Spacing:**
   - Header padding: 40-60px
   - Member box padding: 8-15px
   - Line thickness: 1.5-3px
   - Letter-spacing: 0.5-2px

4. **Design Elements:**
   - Empire: Crown, classic serif, tan/gold
   - Power: Lightning bolt, hexagons, champagne gold
   - Greed: Crown, forest green, white boxes
   - Wolfpack: Wolf silhouette, slate blue, white boxes
   - Pride: Ornaments, gold borders, photo-focused

---

**Document Version:** 3.0 - CORRECTED  
**Last Updated:** October 31, 2025  
**Status:** Accurate color specifications from PDF analysis