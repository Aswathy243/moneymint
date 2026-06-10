import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

function Navbar() {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="text-2xl">💰</span>
        <h1 className="text-xl font-bold text-green-600">Finance Tracker</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Hey, <span className="font-medium text-gray-800">{user?.name}</span>
        </span>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar