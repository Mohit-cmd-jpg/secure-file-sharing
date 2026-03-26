import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Admin() {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState({
    totalUsers: 0,
    totalFiles: 0,
    totalShares: 0,
    storageUsed: 0,
    users: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    // Check if user is admin
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const token = localStorage.getItem('token');

    if (!isAdmin || !token) {
      navigate('/login');
      return;
    }

    fetchAdminData();
  }, [navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all users
      const usersRes = await axios.get(`${import.meta.env.VITE_API_URL}/auth/admin/users`, { headers });
      
      // Fetch all files
      const filesRes = await axios.get(`${import.meta.env.VITE_API_URL}/files/admin/all`, { headers });

      const users = usersRes.data.users || [];
      const files = filesRes.data.files || [];

      // Calculate stats
      const totalShares = files.reduce((sum, file) => sum + (file.sharedWith?.length || 0), 0);
      const storageUsed = Math.round(files.reduce((sum, file) => sum + (file.size || 0), 0) / (1024 * 1024)); // MB

      setAdminData({
        totalUsers: users.length,
        totalFiles: files.length,
        totalShares,
        storageUsed,
        users: users.map(u => ({
          ...u,
          fileCount: files.filter(f => f.uploadedBy === u._id).length
        })),
        recentActivity: files
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10)
          .map(f => ({
            type: 'upload',
            user: users.find(u => u._id === f.uploadedBy)?.email || 'Unknown',
            file: f.filename,
            timestamp: f.createdAt
          }))
      });
      setError('');
    } catch (err) {
      setError('Failed to load admin data: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/auth/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAdminData();
    } catch (err) {
      setError('Failed to delete user: ' + err.message);
    }
  };

  const deleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/files/admin/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAdminData();
    } catch (err) {
      setError('Failed to delete file: ' + err.message);
    }
  };

  const revokeFileAccess = async (fileId, userEmail) => {
    if (!window.confirm(`Revoke ${userEmail}'s access to this file?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/files/admin/${fileId}/revoke`,
        { userEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAdminData();
    } catch (err) {
      setError('Failed to revoke access: ' + err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    navigate('/login');
  };

  const filteredUsers = adminData.users.filter(u =>
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)'
      }}>
        <div className="loading-spinner">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="container navbar-content">
          <span className="navbar-brand" style={{ fontSize: '1.5rem' }}>⚙️ Admin Portal</span>
          <div className="navbar-links">
            <span style={{ color: 'var(--text-muted)' }}>Admin Access</span>
            <button onClick={logout} className="btn btn-secondary" style={{ width: 'auto' }}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container" style={{ padding: '2rem 0' }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            {error}
            <button
              onClick={() => setError('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--error)',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid var(--border)' }}>
          {['dashboard', 'users', 'files', 'activity'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="btn"
              style={{
                border: 'none',
                background: 'none',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '3px solid var(--primary)' : 'none',
                borderRadius: 0,
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ marginBottom: '2rem', fontSize: '1.75rem', fontWeight: '700' }}>
              System Overview
            </h2>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '3rem'
            }}>
              <div style={{
                background: 'var(--surface)',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)'
              }}>
                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Total Users
                </h3>
                <p style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)' }}>
                  {adminData.totalUsers}
                </p>
              </div>

              <div style={{
                background: 'var(--surface)',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)'
              }}>
                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Total Files
                </h3>
                <p style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--secondary)' }}>
                  {adminData.totalFiles}
                </p>
              </div>

              <div style={{
                background: 'var(--surface)',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)'
              }}>
                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Total Shares
                </h3>
                <p style={{ fontSize: '2.5rem', fontWeight: '800', color: '#f59e0b' }}>
                  {adminData.totalShares}
                </p>
              </div>

              <div style={{
                background: 'var(--surface)',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)'
              }}>
                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Storage Used
                </h3>
                <p style={{ fontSize: '2.5rem', fontWeight: '800', color: '#8b5cf6' }}>
                  {adminData.storageUsed} MB
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.75rem', fontWeight: '700' }}>
              User Management
            </h2>

            <input
              type="text"
              placeholder="Search users by email..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="form-group"
              style={{
                marginBottom: '1.5rem',
                width: '100%',
                maxWidth: '400px',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />

            <div style={{
              overflowX: 'auto',
              background: 'var(--surface)',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)' }}>Files</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)' }}>Joined</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, idx) => (
                    <tr key={user._id} style={{
                      borderBottom: idx < filteredUsers.length - 1 ? '1px solid var(--border)' : 'none'
                    }}>
                      <td style={{ padding: '1rem', color: 'var(--text)' }}>{user.email}</td>
                      <td style={{ padding: '1rem', color: 'var(--text)' }}>{user.fileCount}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="btn btn-danger btn-sm"
                          style={{ width: 'auto' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.75rem', fontWeight: '700' }}>
              File Management
            </h2>

            <div style={{
              overflowX: 'auto',
              background: 'var(--surface)',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)' }}>Filename</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)' }}>Size</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)' }}>Shared With</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)' }}>Uploaded</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminData.users.length > 0 && adminData.users.slice(0, 10).map((user, idx) => (
                    <tr key={user._id} style={{
                      borderBottom: '1px solid var(--border)'
                    }}>
                      <td style={{ padding: '1rem', color: 'var(--text)' }}>
                        {user.email} / Files (3)
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text)' }}>---</td>
                      <td style={{ padding: '1rem', color: 'var(--text)' }}>2</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="btn btn-danger btn-sm"
                          style={{ width: 'auto' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.75rem', fontWeight: '700' }}>
              Recent Activity
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {adminData.recentActivity.map((activity, idx) => (
                <div key={idx} style={{
                  background: 'var(--surface)',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <p style={{ color: 'var(--text)', fontWeight: '600', marginBottom: '0.25rem' }}>
                      📤 {activity.user} uploaded "{activity.file}"
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span style={{
                    background: 'var(--surface-light)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)'
                  }}>
                    {activity.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
