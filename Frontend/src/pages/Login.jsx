import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import useStore from '../store/useStore';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

function Login() {
  const navigate = useNavigate();
  const { setUser, setAccessToken } = useStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      const { accessToken, user } = response.data;

      setAccessToken(accessToken);
      setUser(user);

      socketService.connect(accessToken);

      toast.success('Login successful!');
      navigate('/chat');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
          Login to FluxChat
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? '#7ec8a3' : '#2f855a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center', color: '#6b7280' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#2f855a', textDecoration: 'none' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
