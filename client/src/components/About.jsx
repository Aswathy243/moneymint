export default function About() {
  return (
    <div style={{ maxWidth: 750, margin: '0 auto', background: '#111827', borderRadius: 14, padding: '32px', border: '1px solid #1e293b', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
      <h2 style={{ margin: '0 0 8px 0', fontSize: 22, color: '#f8fafc', fontWeight: 800 }}>
        About FYNZOVA
      </h2>
      <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 0, marginBottom: 24 }}>
        Version 1.0.0 — Personal Finance Tracker
      </p>

      <hr style={{ border: 'none', borderTop: '1px solid #1e293b', margin: '24px 0' }} />

      <h3 style={sectionTitleStyle}>🎯 What is FYNZOVA?</h3>
      <p style={bodyTextStyle}>
        Most people don't know where their money goes each month.FYNZOVA makes it easy to log your daily income and expenses, spot spending patterns through visual charts, and download yearly and monthly reports — so you're always in control of your finances.
      </p>

      <h3 style={sectionTitleStyle}>⚡ Features</h3>
      <ul style={{ ...bodyTextStyle, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <li><strong>Dashboard Overview:</strong> See your total income, expenses, and monthly profit or loss at a glance.</li>
        <li><strong>Visual Charts:</strong> Daily expense bar chart and yearly income vs expense line chart to understand your spending patterns.</li>
        <li><strong>Category Breakdown:</strong> Pie chart showing which categories (food, rent, transport) consume most of your budget.</li>
        <li><strong>Reports:</strong> Download a pdf report of all transactions for any month or any year.</li>
      </ul>

      <h3 style={sectionTitleStyle}>🛠 Built With</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {['React.js', 'Node.js', 'Express.js', 'MongoDB', 'Recharts', 'Tailwind CSS', 'JWT Auth'].map(tag => (
          <span key={tag} style={{ background: '#1e293b', color: '#38bdf8', border: '1px solid #334155', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

const sectionTitleStyle = { fontSize: 15, fontWeight: 700, color: '#38bdf8', marginTop: 24, marginBottom: 8 }
const bodyTextStyle = { fontSize: 14, color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 12px 0' }