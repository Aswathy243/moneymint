import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`

// Parse date string directly — avoids UTC→IST timezone shift
const parseLocalDate = (dateStr) => {
  const s = typeof dateStr === 'string' ? dateStr : new Date(dateStr).toISOString()
  const [y, m, d] = s.split('T')[0].split('-').map(Number)
  return { year: y, month: m, day: d }
}

// Case-insensitive type helpers — backend may return 'income' or 'Income'
const isIncomeTx  = (t) => t.type?.toLowerCase() === 'income'
const isExpenseTx = (t) => t.type?.toLowerCase() === 'expense'
const months = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

// Custom Tooltip for Recharts matching Dark Theme
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: '#94a3b8', marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const currentDate = new Date()
  const [view, setView] = useState('monthly') // 'monthly' | 'yearly'
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  // ─── 1. Fetch Transactions from Backend ───
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      try {
        // Retrieve JWT token from localStorage or your custom authStore token reference
        const token = localStorage.getItem('token') 
        
        const res = await fetch('http://localhost:5000/api/transactions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        if (res.ok) {
          const data = await res.json()
          setTransactions(data)
        }
      } catch (err) {
        console.error('Error connecting to transaction api:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  // ─── 2. Filter & Process Calculations Dynamically ───
  
  // Filter transactions based on selected date ranges
  const filteredTransactions = transactions.filter(t => {
    const { year, month } = parseLocalDate(t.date)
    if (view === 'monthly') return year === selectedYear && month === selectedMonth
    return year === selectedYear
  })

  // Calculate dynamic Total Summary metrics
  let totalIncome = 0
  let totalExpense = 0
  filteredTransactions.forEach(t => {
    if (isIncomeTx(t)) totalIncome += t.amount
    else if (isExpenseTx(t)) totalExpense += t.amount
  })
  const balance = totalIncome - totalExpense
  const status = balance >= 0 ? 'profit' : 'loss'

  // ─── 3. Structure Chart Data Groups on the Fly ───
  
  // Generate Daily Data Array (For Monthly View)
  const getDailyChartData = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
    const dailyMap = {}
    
    // Initialize empty days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`
      dailyMap[dayStr] = { day: dayStr, income: 0, expense: 0 }
    }
    
    // Fill with real amounts — use parseLocalDate to avoid UTC shift
    filteredTransactions.forEach(t => {
      const { day } = parseLocalDate(t.date)
      const dayStr = day.toString().padStart(2, '0')
      if (dailyMap[dayStr]) {
        if (isIncomeTx(t)) dailyMap[dayStr].income += t.amount
        else if (isExpenseTx(t)) dailyMap[dayStr].expense += t.amount
      }
    })
    // Sort numerically — Object.values() on digit-keyed objects returns 10,11..30,01..09
    return Object.keys(dailyMap).sort((a, b) => Number(a) - Number(b)).map(k => dailyMap[k])
  }

  // Generate Monthly Data Array (For Yearly View)
  const getYearlyChartData = () => {
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return shortMonths.map((m, index) => {
      let income = 0
      let expense = 0
      
      transactions.forEach(t => {
        const { year: ty, month: tm } = parseLocalDate(t.date)
        if (ty === selectedYear && tm - 1 === index) {
          if (isIncomeTx(t)) income += t.amount
          else if (isExpenseTx(t)) expense += t.amount
        }
      })
      
      return { month: m, income, expense }
    })
  }

  // Generate Category Breakdown Arrays for Pie Charts
  const getCategoryPieData = () => {
    const catMap = {}
    const colors = ['#f97316', '#8b5cf6', '#ec4899', '#ef4444', '#14b8a6', '#64748b', '#eab308', '#3b82f6']
    
    filteredTransactions.filter(t => isExpenseTx(t)).forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount
    })

    return Object.keys(catMap).map((name, i) => ({
      name,
      value: catMap[name],
      color: colors[i % colors.length]
    }))
  }

  const barData = view === 'monthly' ? getDailyChartData() : getYearlyChartData()
  const barXKey = view === 'monthly' ? 'day' : 'month'
  const pieData = getCategoryPieData()
  
  const barLabel = view === 'monthly'
    ? `Daily Expenses — ${months[selectedMonth - 1]} ${selectedYear}`
    : `Monthly Overview — ${selectedYear}`

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8', fontSize: '15px' }}>Loading transaction ledger inputs…</div>
  }

  return (
    <div>
      {/* ── Filter Controls ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <div style={{ display: 'flex', background: '#334155', borderRadius: 10, padding: 4, gap: 4 }}>
          {['monthly', 'yearly'].map(v => (
            <button
              key={v} onClick={() => setView(v)}
              style={{
                padding: '7px 20px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                background: view === v ? '#0f172a' : 'transparent',
                color: view === v ? '#fff' : '#94a3b8'
              }}
            >
              {v === 'monthly' ? '📅 Monthly View' : '📆 Yearly View'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {view === 'monthly' && (
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={selectStyle}>
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          )}
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={selectStyle}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* ── Live Total Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 32 }}>
        <SummaryCard label="Total Income" value={fmt(totalIncome)} accent="#10b981" icon="📈" />
        <SummaryCard label="Total Expense" value={fmt(totalExpense)} accent="#ef4444" icon="📉" />
        <SummaryCard
          label={<>Balance — <span style={{ color: status === 'profit' ? '#38bdf8' : '#f97316', fontWeight: 600 }}>{status === 'profit' ? '🟢 Profit' : '🔴 Loss'}</span></>}
          value={fmt(balance)}
          accent={status === 'profit' ? '#38bdf8' : '#f97316'}
          icon="💼"
        />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }}>
        
        {/* Bar Chart */}
        <div style={cardStyle}>
          <h3 style={chartTitle}>{barLabel}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey={barXKey} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${v >= 1000 ? (v/1000)+'k' : v}`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="Expense" fill="#f87171" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div style={cardStyle}>
          <h3 style={chartTitle}>Expense Breakdown</h3>
          {pieData.length === 0 ? (
            <div style={{ textTransform: 'uppercase', fontSize: '11px', textAlign: 'center', color: '#94a3b8', padding: '60px 0' }}>No Expenses Logged</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {pieData.map((c) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                      <span style={{ color: '#94a3b8' }}>{c.name}</span>
                    </div>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{fmt(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  )
}

function SummaryCard({ label, value, accent, icon }) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 14, padding: '20px 22px', borderLeft: `4px solid ${accent}`, borderTop: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{label}</div>
      </div>
      <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>{value}</p>
    </div>
  )
}

const cardStyle = { background: '#1e293b', borderRadius: 14, padding: '22px 24px', border: '1px solid #334155', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }
const chartTitle = { fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 18, letterSpacing: '-0.2px', marginTop: 0 }
const selectStyle = { border: '1px solid #334155', borderRadius: 8, padding: '8px 14px', fontSize: 13, background: '#0f172a', color: '#fff', outline: 'none', cursor: 'pointer' }