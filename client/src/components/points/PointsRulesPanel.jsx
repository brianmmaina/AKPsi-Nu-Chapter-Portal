const rules = [
  {
    title: 'Base values',
    items: [
      'Chapter meetings: 8 pts',
      'Professional / PD events: 10–15 pts',
      'DEI forums & workshops: 12 pts',
      'Service projects: 15 pts',
      'Social / committee touchpoints: 5–8 pts',
    ],
  },
  {
    title: 'External credit',
    items: [
      'Non-AKPsi events need prior approval from VPPD / VPAA / VPAR.',
      'Submit proof (agenda, photo, or reflection) within one week.',
    ],
  },
  {
    title: 'Transparency & privacy',
    items: [
      'Dashboard only shows positive points — no fines or J-Board info.',
      'Corrections go straight to VPAA; sensitive notes stay offline.',
    ],
  },
];

const PointsRulesPanel = () => (
  <div className="points-rules">
    <div className="points-rules__header">
      <h3>Point rules & transparency</h3>
      <p>Quick reference for brothers and future VPAAs.</p>
    </div>
    {rules.map((section) => (
      <section key={section.title}>
        <h4>{section.title}</h4>
        <ul>
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    ))}
    <p className="points-rules__disclaimer">
      Questions? Email VPAA — this dashboard celebrates participation and keeps sensitive actions private.
    </p>
  </div>
);

export default PointsRulesPanel;

