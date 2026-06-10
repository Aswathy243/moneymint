import api from '../utils/api'
import { useState, useEffect } from 'react'

const EXPENSE_CATEGORIES = ['Food & Dining', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Others']

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const parseLocalDate = (dateStr) => {
  const s = typeof dateStr === 'string' ? dateStr : new Date(dateStr).toISOString()
  const [y, m, d] = s.split('T')[0].split('-').map(Number)
  return { year: y, month: m, day: d }
}

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`
const isIncomeTx  = (t) => t.type?.toLowerCase() === 'income'
const isExpenseTx = (t) => t.type?.toLowerCase() === 'expense'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  // Form State for creating a new transaction
 const [formData, setFormData] = useState({
  type: 'expense',  // lowercase
  amount: '',
  date: new Date().toISOString().split('T')[0],
  category: 'Food & Dining',
  note: ''
})

  const isIncome = formData.type === 'income'

  // State to track which transaction ID is currently being edited inline
  const [editingId, setEditingId] = useState(null)
  const [editFormData, setEditFormData] = useState({})

  // Report download state
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType]           = useState('monthly') // 'monthly' | 'yearly'
  const [reportMonth, setReportMonth]         = useState(new Date().getMonth() + 1)
  const [reportYear, setReportYear]           = useState(new Date().getFullYear())

  // Fetch authorization token helper
  const token = localStorage.getItem('token')

  // ─── 1. Fetch Transactions on Mount ───
  const fetchTransactions = async () => {
  try {
    const res = await api.get('/transactions')
    setTransactions(res.data)
  } catch (err) {
    console.error('Error fetching transactions:', err)
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    fetchTransactions()
  }, [])

  // ─── 2. Create Transaction (POST) ───
const handleSubmit = async (e) => {
  e.preventDefault()
  if (!formData.amount || Number(formData.amount) <= 0) return alert('Enter a valid amount')

  try {
    const res = await api.post('/transactions', formData)
    const newTx = res.data
    setTransactions([newTx, ...transactions])
    setFormData({ ...formData, amount: '', note: '' })
  } catch (err) {
    console.error('Error recording transaction:', err)
    alert('Failed to save transaction backend-side.')
  }
}

  // ─── 3. Delete Transaction (DELETE) ───
  const handleDelete = async (id) => {
  if (!window.confirm('Are you sure you want to permanently delete this transaction?')) return

  try {
    await api.delete(`/transactions/${id}`)
    setTransactions(transactions.filter(t => t._id !== id))
  } catch (err) {
    console.error('Error deleting entry:', err)
    alert('Could not delete transaction.')
  }
}

  // ─── 4. Initialize Inline Update Mode ───
  const startEdit = (t) => {
    setEditingId(t._id)
    setEditFormData({
      type: t.type,
      amount: t.amount,
      date: new Date(t.date).toISOString().split('T')[0],
      category: t.category,
      note: t.note
    })
  }

  // ─── 5. Save Updated Transaction (PUT) ───
  const handleUpdateSubmit = async (id) => {
  if (!editFormData.amount || Number(editFormData.amount) <= 0) return alert('Enter a valid amount')

  try {
    const res = await api.put(`/transactions/${id}`, editFormData)
    setTransactions(transactions.map(t => t._id === id ? res.data : t))
    setEditingId(null)
  } catch (err) {
    console.error('Error updating transaction:', err)
    alert('Failed to apply modification changes.')
  }
}

  // ─── 6. Generate & Print PDF Report ───
  const generatePDF = () => {
    const filtered = transactions.filter(t => {
      const { year, month } = parseLocalDate(t.date)
      if (reportType === 'monthly') return year === reportYear && month === reportMonth
      return year === reportYear
    })

    let totalIncome = 0, totalExpense = 0
    filtered.forEach(t => {
      if (isIncomeTx(t)) totalIncome += t.amount
      else if (isExpenseTx(t)) totalExpense += t.amount
    })
    const balance = totalIncome - totalExpense

    // Build grouped data for yearly view
    const buildYearlyRows = () => {
      return SHORT_MONTHS.map((m, i) => {
        const monthTxs = filtered.filter(t => parseLocalDate(t.date).month - 1 === i)
        const inc = monthTxs.filter(isIncomeTx).reduce((s, t) => s + t.amount, 0)
        const exp = monthTxs.filter(isExpenseTx).reduce((s, t) => s + t.amount, 0)
        return { month: m, income: inc, expense: exp, net: inc - exp }
      }).filter(r => r.income > 0 || r.expense > 0)
    }

    const periodLabel = reportType === 'monthly'
      ? `${MONTHS[reportMonth - 1]} ${reportYear}`
      : `Year ${reportYear}`

    const tableRows = reportType === 'monthly'
      ? filtered.sort((a, b) => parseLocalDate(a.date).day - parseLocalDate(b.date).day).map(t => {
          const { day } = parseLocalDate(t.date)
          return `<tr>
            <td>${day} ${SHORT_MONTHS[reportMonth - 1]}</td>
            <td>${isIncomeTx(t) ? 'Income' : t.category}</td>
            <td style="font-style:italic;color:#64748b">${t.note || '—'}</td>
            <td style="color:${isIncomeTx(t) ? '#16a34a' : '#dc2626'};font-weight:600">${t.type}</td>
            <td style="color:${isIncomeTx(t) ? '#16a34a' : '#dc2626'};font-weight:700">${isIncomeTx(t) ? '+' : '-'} ${fmt(t.amount)}</td>
          </tr>`
        }).join('')
      : buildYearlyRows().map(r => `<tr>
          <td>${r.month} ${reportYear}</td>
          <td style="color:#16a34a;font-weight:600">${fmt(r.income)}</td>
          <td style="color:#dc2626;font-weight:600">${fmt(r.expense)}</td>
          <td style="color:${r.net >= 0 ? '#2563eb' : '#ea580c'};font-weight:700">${fmt(r.net)}</td>
        </tr>`).join('')

    const headers = reportType === 'monthly'
      ? '<tr><th>Date</th><th>Category</th><th>Note</th><th>Type</th><th>Amount</th></tr>'
      : '<tr><th>Month</th><th>Income</th><th>Expense</th><th>Net</th></tr>'

    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head>
      <title>MONEYMINT Report — ${periodLabel}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; color: #1e293b; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
        .brand { font-size: 22px; font-weight: 800; color: #0f172a; }
        .brand span { color: #0ea5e9; }
        .meta { text-align: right; font-size: 13px; color: #64748b; }
        .meta strong { display: block; font-size: 16px; color: #0f172a; margin-bottom: 4px; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
        .card { padding: 16px 20px; border-radius: 10px; border: 1px solid #e2e8f0; }
        .card p { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .card h3 { font-size: 22px; font-weight: 800; }
        .inc { border-left: 4px solid #22c55e; } .inc h3 { color: #16a34a; }
        .exp { border-left: 4px solid #ef4444; } .exp h3 { color: #dc2626; }
        .bal { border-left: 4px solid #3b82f6; } .bal h3 { color: ${balance >= 0 ? '#2563eb' : '#ea580c'}; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead tr { background: #f8fafc; }
        th { padding: 10px 14px; text-align: left; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
        td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }
        tr:hover { background: #fafafa; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <div>
          <div class="brand">💰 MONEY<span>MINT</span></div>
          <div style="font-size:13px;color:#64748b;margin-top:6px">${reportType === 'monthly' ? 'Monthly' : 'Annual'} Financial Report</div>
        </div>
        <div class="meta">
          <strong>${periodLabel}</strong>
          Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>
      <div class="summary">
        <div class="card inc"><p>Total Income</p><h3>${fmt(totalIncome)}</h3></div>
        <div class="card exp"><p>Total Expense</p><h3>${fmt(totalExpense)}</h3></div>
        <div class="card bal"><p>Balance — ${balance >= 0 ? '🟢 Profit' : '🔴 Loss'}</p><h3>${fmt(balance)}</h3></div>
      </div>
      <table><thead>${headers}</thead><tbody>
        ${tableRows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px">No transactions found for this period.</td></tr>'}
      </tbody></table>
      <div class="footer">MONEYMINT — Personal Finance Tracker &nbsp;·&nbsp; ${periodLabel}</div>
    </body></html>`)
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 400)
    setShowReportModal(false)
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>Loading secure ledger modules...</div>
  }

  return (
    <div>

    {/* ── Download Report Modal ── */}
    {showReportModal && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: '28px 32px', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
          <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>📄 Download Report</h3>

          {/* Report type toggle */}
          <label style={labelStyle}>Report Type</label>
          <div style={{ display: 'flex', background: '#0f172a', borderRadius: 8, padding: 4, gap: 4, margin: '8px 0 18px' }}>
            {['monthly', 'yearly'].map(v => (
              <button key={v} type="button" onClick={() => setReportType(v)} style={{
                flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: reportType === v ? '#38bdf8' : 'transparent',
                color: reportType === v ? '#0f172a' : '#94a3b8'
              }}>{v === 'monthly' ? '📅 Monthly' : '📆 Yearly'}</button>
            ))}
          </div>

          {/* Month picker — only for monthly */}
          {reportType === 'monthly' && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Month</label>
              <select value={reportMonth} onChange={e => setReportMonth(Number(e.target.value))} style={{ ...darkInputStyle, marginTop: 6 }}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
          )}

          {/* Year picker */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Year</label>
            <select value={reportYear} onChange={e => setReportYear(Number(e.target.value))} style={{ ...darkInputStyle, marginTop: 6 }}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={generatePDF} style={{ flex: 1, background: '#38bdf8', color: '#0f172a', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              ⬇ Download PDF
            </button>
            <button onClick={() => setShowReportModal(false)} style={{ padding: '12px 16px', background: 'transparent', border: '1px solid #475569', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Download Report Button Bar ── */}
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
      <button onClick={() => setShowReportModal(true)} style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', color: '#fff',
        border: 'none', padding: '10px 20px', borderRadius: 9, fontWeight: 700,
        fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 10px rgba(15,23,42,0.3)'
      }}>
        📄 Download Report
      </button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '32px' }}>
      
      {/* ── Left Side: Create Entry Card ── */}
      <div style={darkCardStyle}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#38bdf8', marginTop: 0 }}>
          Add Transaction
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={labelStyle}>Transaction Type</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              {['Income', 'Expense'].map(t => (
                <button
                  key={t} type="button"
                  onClick={() => setFormData({ ...formData, type: t.toLowerCase(), category: t === 'Income' ? '' : 'Food & Dining' })}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                    background: formData.type === t ? (t === 'Income' ? '#10b981' : '#ef4444') : '#334155',
                    color: '#fff', transition: 'all 0.15s'
                  }}
                >
                  {t === 'Income' ? '🟢 Income' : '🔴 Expense'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Amount (₹)</label>
            <input 
              type="number" style={darkInputStyle} placeholder="0.00" required
              value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isIncome ? '1fr' : '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" style={darkInputStyle} required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
            {!isIncome && (
              <div>
                <label style={labelStyle}>Category</label>
                <select style={darkInputStyle} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Description / Notes</label>
            <input 
              type="text" style={darkInputStyle} placeholder="Optional details..." 
              value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} 
            />
          </div>

          <button type="submit" style={submitBtnStyle}>💾 Save Transaction</button>
        </form>
      </div>

      {/* ── Right Side: Activity Log & Interactive Options ── */}
      <div style={darkCardStyle}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#fff', marginTop: 0 }}>
          Recent Activity Log
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '580px', overflowY: 'auto', paddingRight: '4px' }}>
          {transactions.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>No logged entries found.</div>
          ) : transactions.map(t => {
            const isEditing = editingId === t._id

            return (
              <div key={t._id} style={{ ...transactionRowStyle, borderLeft: `4px solid ${t.type === 'income' ? '#10b981' : '#ef4444'}` }}>
                {isEditing ? (
                  /* Inline Edit Mode Layout Window */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: editFormData.type === 'Income' ? '120px 1fr 150px' : '120px 1fr 150px 150px', gap: '10px' }}>
                      <select style={inlineInputStyle} value={editFormData.type} onChange={e => setEditFormData({ ...editFormData, type: e.target.value, category: e.target.value === 'Income' ? '' : (editFormData.category || 'Food & Dining') })}>
                        <option value="Income">Income</option>
                        <option value="Expense">Expense</option>
                      </select>
                      <input type="number" style={inlineInputStyle} value={editFormData.amount} onChange={e => setEditFormData({ ...editFormData, amount: e.target.value })} placeholder="Amount" />
                      <input type="date" style={inlineInputStyle} value={editFormData.date} onChange={e => setEditFormData({ ...editFormData, date: e.target.value })} />
                      {editFormData.type === 'Expense' && (
                        <select style={inlineInputStyle} value={editFormData.category} onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}>
                          {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="text" style={{ ...inlineInputStyle, flex: 1 }} value={editFormData.note} onChange={e => setEditFormData({ ...editFormData, note: e.target.value })} placeholder="Add customized details..." />
                      <button onClick={() => handleUpdateSubmit(t._id)} style={saveRowBtn}>Save ✔</button>
                      <button onClick={() => setEditingId(null)} style={cancelRowBtn}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  /* Standard List Row View Layout Window */
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '10px', 
                        background: t.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                      }}>
                        {t.type === 'income' ? '💰' : '🛒'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#fff' }}>
                          {t.type === 'income' ? 'Income' : t.category}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                          {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {t.type === 'Expense' && t.category && (
                            <span style={{
                              marginLeft: '8px', background: 'rgba(239,68,68,0.12)',
                              color: '#f87171', fontSize: '10px', fontWeight: '700',
                              padding: '2px 8px', borderRadius: '20px'
                            }}>{t.category}</span>
                          )}
                          {t.note && <span style={{ marginLeft: '6px' }}>• {t.note}</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: t.type === 'income' ? '#10b981' : '#f87171' }}>
                        {t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString('en-IN')}
                      </span>
                      {/* Interactive Configuration Menu Links */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => startEdit(t)} style={actionEditBtn}>✏️</button>
                        <button onClick={() => handleDelete(t._id)} style={actionDeleteBtn}>🗑️</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
    </div>
  )
}

// ─── Shared Theme Style Modules ───
const darkCardStyle = { background: '#1e293b', padding: '26px', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }
const labelStyle = { fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }
const darkInputStyle = { width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '13px', marginTop: '6px', boxSizing: 'border-box', outline: 'none' }
const submitBtnStyle = { background: '#38bdf8', color: '#0f172a', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', marginTop: '8px', boxShadow: '0 4px 12px rgba(56,189,248,0.2)' }
const transactionRowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#0f172a', borderRadius: '12px', border: '1px solid #334155', transition: 'all 0.2s' }

const inlineInputStyle = { background: '#1e293b', border: '1px solid #475569', color: '#fff', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', outline: 'none' }
const saveRowBtn = { background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }
const cancelRowBtn = { background: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }

const actionEditBtn = { background: '#334155', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', transition: '0.2s' }
const actionDeleteBtn = { background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', transition: '0.2s' }