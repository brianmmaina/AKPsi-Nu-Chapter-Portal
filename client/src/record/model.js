// Normalized chapter model: one shape whether data is live (Express +
// Sheets/Supabase points) or the bundled offline sample.
// Port of the design prototype's dataModel() / sampleModel() / layoutTree().

import { FAMILY_PALETTE, EXTRA_ACCENTS, initials } from './palette';
import { SAMPLE_DATA, SAMPLE_NAMES, SAMPLE_META, SAMPLE_BIG_MAP } from './sampleData';

const streakKeyFor = (s) => (s >= 8 ? 'goat' : s >= 5 ? 'locked' : s >= 3 ? 'on-fire' : null);

const pointsIndexByName = (pointsData) => {
  const idx = {};
  if (pointsData && pointsData.members) {
    pointsData.members.forEach((m) => {
      idx[String(m.memberName || '').toLowerCase()] = m;
    });
  }
  return idx;
};

/**
 * Build the normalized model from live backend data.
 * families: rows from GET /api/families
 * trees: { [familyId]: { brothers, relationships } }
 * pointsData: PointsData from pointsService (or null)
 */
export function buildLiveModel(families, trees, pointsData) {
  const pointsByName = pointsIndexByName(pointsData);
  const FAM = {};
  const brothers = {};
  const byFamily = {};
  const bigOf = {};
  const famOrder = [];
  let extraIdx = 0;

  families.forEach((f) => {
    const fid = String(f.id);
    const key = String(f.name || '').toLowerCase();
    const pal =
      FAMILY_PALETTE[key] || {
        accent: EXTRA_ACCENTS[extraIdx++ % EXTRA_ACCENTS.length],
        soft: 'rgba(43,35,24,.07)',
        softBorder: 'rgba(43,35,24,.3)',
        subtitle: '',
      };
    const tree = (trees && trees[fid]) || { brothers: [], relationships: [] };
    const bros = tree.brothers || [];
    FAM[fid] = {
      name: f.name || 'Family',
      letter: String(f.name || '?').charAt(0).toUpperCase(),
      accent: pal.accent,
      soft: pal.soft,
      softBorder: pal.softBorder,
      subtitle: pal.subtitle || '',
      founded: '',
      count: bros.length,
    };
    famOrder.push(fid);
    byFamily[fid] = [];
    (tree.relationships || []).forEach((r) => {
      if (r.little_id != null) bigOf[String(r.little_id)] = r.big_id != null ? String(r.big_id) : null;
    });
    bros.forEach((b) => {
      const id = String(b.id);
      byFamily[fid].push(id);
      const pm = pointsByName[String(b.name || '').toLowerCase()];
      brothers[id] = {
        id,
        name: b.name || '—',
        pledgeClass: b.pledge_class || '—',
        major: b.major || '—',
        gradYear: b.graduation_year ? String(b.graduation_year) : '—',
        role: b.status === 'graduated' ? 'Alumnus' : 'Active Brother',
        bio: b.fun_facts || b.career_aspirations || '',
        career: b.career_aspirations || '',
        email: b.email || '',
        linkedin: b.linkedin_url || '',
        instagram: b.instagram_url || '',
        website: b.personal_website_url || '',
        photo: b.profile_image_url || '',
        status: b.status || 'studying',
        isTransfer: !!b.is_transfer,
        familyId: fid,
        family: FAM[fid].name,
        accent: FAM[fid].accent,
        soft: FAM[fid].soft,
        softBorder: FAM[fid].softBorder,
        initials: initials(b.name),
        points: pm ? pm.totalPoints : 0,
        streak: pm ? pm.streak || 0 : 0,
        streakKey: pm ? pm.streakKey || null : null,
        bigName: '—',
        pointsMemberId: pm ? pm.memberId : null,
      };
    });
  });

  Object.keys(brothers).forEach((id) => {
    const bg = bigOf[id];
    if (bg && brothers[bg]) brothers[id].bigName = brothers[bg].name;
  });

  return { FAM, famOrder, brothers, byFamily, bigOf, live: true };
}

/** Offline sample model (server unreachable). */
export function buildSampleModel() {
  const streakFor = (p) =>
    p > 200 ? 9 : p > 180 ? 6 : p > 150 ? 5 : p > 120 ? 4 : p > 95 ? 3 : p > 80 ? 2 : p > 60 ? 1 : 0;

  const FAM = {};
  const brothers = {};
  const byFamily = {};
  const bigOf = {};
  const famOrder = Object.keys(SAMPLE_DATA);

  famOrder.forEach((fid) => {
    const pal = FAMILY_PALETTE[fid];
    FAM[fid] = {
      name: SAMPLE_NAMES[fid],
      letter: SAMPLE_NAMES[fid][0],
      accent: pal.accent,
      soft: pal.soft,
      softBorder: pal.softBorder,
      subtitle: pal.subtitle,
      founded: SAMPLE_META[fid].founded,
      count: SAMPLE_DATA[fid].length,
    };
    byFamily[fid] = [];
    SAMPLE_DATA[fid].forEach((r, i) => {
      const id = `${fid}-${i}`;
      byFamily[fid].push(id);
      if (SAMPLE_BIG_MAP[i] != null) bigOf[id] = `${fid}-${SAMPLE_BIG_MAP[i]}`;
      const points = r[6];
      const streak = streakFor(points);
      brothers[id] = {
        id,
        name: r[0],
        pledgeClass: r[1],
        major: r[2],
        gradYear: r[3],
        role: r[4],
        bio: r[5],
        career: '',
        email: '',
        linkedin: '',
        instagram: '',
        website: '',
        photo: '',
        status: 'studying',
        isTransfer: false,
        points,
        familyId: fid,
        family: SAMPLE_NAMES[fid],
        accent: FAM[fid].accent,
        soft: FAM[fid].soft,
        softBorder: FAM[fid].softBorder,
        initials: initials(r[0]),
        streak,
        streakKey: streakKeyFor(streak),
        bigName: '—',
        pointsMemberId: null,
      };
    });
  });

  Object.keys(brothers).forEach((id) => {
    const bg = bigOf[id];
    if (bg && brothers[bg]) brothers[id].bigName = brothers[bg].name;
  });

  return { FAM, famOrder, brothers, byFamily, bigOf, live: false };
}

/**
 * Generic layered layout for arbitrary big→little graphs (any depth).
 * Returns absolutely-positioned nodes and rotated line segments.
 */
export function layoutTree(M, fid) {
  const ids = M.byFamily[fid] || [];
  const idSet = {};
  ids.forEach((id) => {
    idSet[id] = true;
  });
  const kids = {};
  const hasBig = {};
  ids.forEach((id) => {
    const bg = M.bigOf[id];
    if (bg && idSet[bg]) {
      (kids[bg] = kids[bg] || []).push(id);
      hasBig[id] = true;
    }
  });
  const roots = ids.filter((id) => !hasBig[id]);
  const W = 150;
  const H = 52;
  const HG = 16;
  const VG = 46;
  let cursor = 0;
  let maxDepth = 0;
  const pos = {};
  const seen = {};
  const place = (id, depth) => {
    if (seen[id]) return pos[id] ? pos[id].x : 0; // cycle guard
    seen[id] = true;
    maxDepth = Math.max(maxDepth, depth);
    const ch = kids[id] || [];
    if (!ch.length) {
      pos[id] = { x: cursor * (W + HG), depth };
      cursor += 1;
      return pos[id].x;
    }
    const xs = ch.map((c) => place(c, depth + 1));
    pos[id] = { x: (Math.min(...xs) + Math.max(...xs)) / 2, depth };
    return pos[id].x;
  };
  roots.forEach((r) => place(r, 0));
  ids.forEach((id) => {
    if (!pos[id]) {
      pos[id] = { x: cursor * (W + HG), depth: 0 };
      cursor += 1;
    }
  });
  const yOf = (d) => d * (H + VG);
  const nodes = [];
  const edges = [];
  ids.forEach((id) => {
    const b = M.brothers[id];
    const p = pos[id];
    const isRoot = !hasBig[id];
    nodes.push({
      id,
      x: Math.round(p.x),
      y: yOf(p.depth),
      w: W,
      h: H,
      name: b.name,
      sub: (b.pledgeClass || '') + (isRoot && Object.keys(kids).length ? ' · Founder' : ''),
      isRoot,
    });
    (kids[id] || []).forEach((c) => {
      const cp = pos[c];
      const x1 = p.x + W / 2;
      const y1 = yOf(p.depth) + H;
      const x2 = cp.x + W / 2;
      const y2 = yOf(cp.depth);
      const dx = x2 - x1;
      const dy = y2 - y1;
      edges.push({
        left: Math.round(x1),
        top: Math.round(y1),
        width: Math.round(Math.sqrt(dx * dx + dy * dy)),
        angle: Math.round((Math.atan2(dy, dx) * 180) / Math.PI * 100) / 100,
      });
    });
  });
  return {
    nodes,
    edges,
    width: Math.max(1, cursor) * (W + HG) - HG,
    height: (maxDepth + 1) * (H + VG) - VG + 8,
    hasRels: Object.keys(kids).length > 0,
  };
}
