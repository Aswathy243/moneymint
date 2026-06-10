const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()

connectDB()

const app = express()

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://moneymint-rho.vercel.app',
    'https://moneymint-git-main-moneymint.vercel.app',
    'https://moneymint.vercel.app'
  ],
  credentials: true
}))
app.use(express.json())

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/transactions', require('./routes/transactions'))


app.get('/', (req, res) => {
  res.json({ message: 'Finance Tracker API is running' })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})