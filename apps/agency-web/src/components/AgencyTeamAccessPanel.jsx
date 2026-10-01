import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { FaPlus, FaSearch, FaSyncAlt, FaEdit, FaTrash, FaUsers, FaUserShield, FaTools } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../config';
import AgencyConflictResolutionModal from './AgencyConflictResolutionModal';
import { confirmAction } from '../utils/confirmAction';

const emptyForm = { username: '', email: '', mobile: '', password: '', role: 'field_technician' };

export default function AgencyTeamAccessPanel({ role = 'admin' }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(null);
  const token = localStorage.getItem('token');
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  const canManageAdmins = role === 'superadmin';

  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await axios.get(`${API_URL}/api/users`, auth);
      setUsers(Array.isArray(data) ? data : data?.users || []);
    } catch (e) { setError(e.response?.data?.message || 'Unable to load Agency team.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => users.filter((user) => {
    const q = query.trim().toLowerCase();
    if (q && ![user.username, user.email, user.mobile, user.role].some((v) => String(v || '').toLowerCase().includes(q))) return false;
    if (roleFilter && user.role !== roleFilter) return false;
    if (statusFilter === 'active' && user.isActive === false) return false;
    if (statusFilter === 'inactive' && user.isActive !== false) return false;
    return true;
  }), [users, query, roleFilter, statusFilter]);

  const openCreate = () => {
    setEditing(null); setError(''); setForm({ ...emptyForm, role: canManageAdmins ? 'admin' : 'field_technician' }); setShowForm(true);
  };
  const openEdit = (user) => {
    if (!canManageAdmins && user.role !== 'field_technician') return;
    setEditing(user); setError('');
    setForm({ username: user.username || '', email: user.email || '', mobile: user.mobile || '', password: '', role: user.role || 'field_technician' });
    setShowForm(true);
  };

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await axios.put(`${API_URL}/api/users/update/${editing._id}`, form, auth);
      else await axios.post(`${API_URL}/api/users/register`, form, auth);
      setShowForm(false); setEditing(null); setForm(emptyForm); await load();
    } catch (e) {
      if (e.response?.status === 409 && e.response?.data?.conflict) setConflict(e.response.data.conflict);
      else setError(e.response?.data?.message || 'Unable to save this user.');
    } finally { setSaving(false); }
  };

  const updateConflict = async () => {
    if (!conflict?.existingId) return;
    setSaving(true); setError('');
    try {
      await axios.put(`${API_URL}/api/users/update/${conflict.existingId}`, { ...form, password: form.password || undefined }, auth);
      setConflict(null); setShowForm(false); setEditing(null); setForm(emptyForm); await load();
    } catch (e) { setError(e.response?.data?.message || 'Unable to update the existing user.'); }
    finally { setSaving(false); }
  };

  const remove = async (user) => {
    if (!canManageAdmins) return;
    try { const impact=await axios.get(`${API_URL}/api/users/${user._id}/delete-impact`,auth); if(!impact.data?.deletable){setError(impact.data?.message||'This user has protected operational history. Deactivate the account instead.');return;} } catch(e){setError(e.response?.data?.message||'Unable to inspect delete impact.');return;}
    const decision = await confirmAction({ title: 'Permanently delete Agency user?', message: `${user.username} has no protected operational history and will lose access immediately.`, confirmLabel: 'Delete permanently', tone: 'danger', requireReason:true, reasonLabel:'Deletion reason', requireText:'DELETE', textLabel:'Type' });
    if (!decision.confirmed) return;
    try { await axios.delete(`${API_URL}/api/users/${user._id}`, {...auth,data:{reason:decision.reason}}); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Unable to delete user.'); }
  };

  const admins = users.filter((u) => ['admin', 'superadmin'].includes(u.role)).length;
  const technicians = users.filter((u) => u.role === 'field_technician').length;
  const active = users.filter((u) => u.isActive !== false).length;

  return <section className="agency-team-panel">
    <header className="agency-section-header">
      <div><span>TEAM & ACCESS</span><h2>Agency users</h2><p>Create and manage scoped users without leaving the Agency workspace.</p></div>
      <div className="agency-section-actions"><Button variant="outline-secondary" onClick={load} disabled={loading}><FaSyncAlt /> Refresh</Button><Button onClick={openCreate}><FaPlus /> {canManageAdmins ? 'Add user' : 'Add technician'}</Button></div>
    </header>

    <div className="agency-team-kpis">
      <article><FaUsers /><span>Total users</span><strong>{users.length}</strong></article>
      <article><FaUserShield /><span>Admins</span><strong>{admins}</strong></article>
      <article><FaTools /><span>Technicians</span><strong>{technicians}</strong></article>
      <article><span className="agency-status-dot"/><span>Active</span><strong>{active}</strong></article>
    </div>

    <div className="agency-data-toolbar">
      <div className="agency-data-search"><FaSearch/><Form.Control value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, mobile or role" /></div>
      <Form.Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}><option value="">All roles</option>{canManageAdmins && <option value="admin">Admin</option>}<option value="field_technician">Field technician</option></Form.Select>
      <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All status</option><option value="active">Active</option><option value="inactive">Inactive</option></Form.Select>
      <span className="agency-result-count"><b>{filtered.length}</b> users</span>
    </div>

    {error && <div className="agency-inline-error">{error}</div>}
    <div className="agency-table-shell">
      {loading ? <div className="agency-panel-loader"><Spinner size="sm"/> Loading team…</div> : <Table hover responsive className="agency-data-table"><thead><tr><th>User</th><th>Contact</th><th>Role</th><th>Status</th><th>Last seen</th><th>Actions</th></tr></thead><tbody>
        {filtered.map((user) => <tr key={user._id}><td><strong>{user.username}</strong><small>{user._id}</small></td><td><span>{user.mobile || '—'}</span><small>{user.email || '—'}</small></td><td><Badge bg="light" text="dark">{String(user.role || '').replaceAll('_', ' ')}</Badge></td><td><span className={`agency-state-pill ${user.isActive === false ? 'is-muted' : 'is-success'}`}>{user.isActive === false ? 'Inactive' : 'Active'}</span></td><td>{user.lastSeen ? new Date(user.lastSeen).toLocaleString('en-IN') : '—'}</td><td><div className="agency-row-actions">{(canManageAdmins || user.role === 'field_technician') && <Button size="sm" variant="outline-secondary" onClick={() => openEdit(user)}><FaEdit/> Edit</Button>}{canManageAdmins && user.role !== 'superadmin' && <Button size="sm" variant="outline-danger" onClick={() => remove(user)}><FaTrash/> Delete</Button>}</div></td></tr>)}
        {!filtered.length && <tr><td colSpan="6"><div className="agency-empty-inline">No users match the current filters.</div></td></tr>}
      </tbody></Table>}
    </div>

    <Modal show={showForm} onHide={() => !saving && setShowForm(false)} centered size="lg"><Form onSubmit={save}><Modal.Header closeButton={!saving}><div><small className="agency-modal-kicker">TEAM ACCESS</small><Modal.Title>{editing ? 'Edit Agency user' : (canManageAdmins ? 'Add Agency user' : 'Add field technician')}</Modal.Title><p>{canManageAdmins ? 'Assign the minimum role needed for this user.' : 'Agency Admins can create and manage field technicians only.'}</p></div></Modal.Header><Modal.Body>
      {error && <div className="agency-inline-error">{error}</div>}
      <div className="agency-form-grid"><Form.Group><Form.Label>Username</Form.Label><Form.Control value={form.username} onChange={(e) => setForm((x) => ({ ...x, username: e.target.value }))} required /></Form.Group><Form.Group><Form.Label>Mobile</Form.Label><Form.Control inputMode="tel" value={form.mobile} onChange={(e) => setForm((x) => ({ ...x, mobile: e.target.value }))} required /></Form.Group><Form.Group><Form.Label>Email</Form.Label><Form.Control type="email" value={form.email} onChange={(e) => setForm((x) => ({ ...x, email: e.target.value }))} required /></Form.Group><Form.Group><Form.Label>Role</Form.Label><Form.Select value={form.role} disabled={!canManageAdmins} onChange={(e) => setForm((x) => ({ ...x, role: e.target.value }))}>{canManageAdmins && <option value="admin">Admin</option>}<option value="field_technician">Field Technician</option></Form.Select></Form.Group><Form.Group className="agency-form-grid__full"><Form.Label>{editing ? 'New password (optional)' : 'Temporary password'}</Form.Label><Form.Control type="password" minLength={12} value={form.password} onChange={(e) => setForm((x) => ({ ...x, password: e.target.value }))} required={!editing} placeholder={editing ? 'Leave blank to keep current password' : '12+ characters'} /><Form.Text>Use a temporary password and share it through your normal secure onboarding process.</Form.Text></Form.Group></div>
    </Modal.Body><Modal.Footer><Button variant="outline-secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create user'}</Button></Modal.Footer></Form></Modal>

    <AgencyConflictResolutionModal conflict={conflict} busy={saving} onClose={() => setConflict(null)} onSkip={() => { setConflict(null); setShowForm(false); }} onUpdate={updateConflict} />
  </section>;
}
