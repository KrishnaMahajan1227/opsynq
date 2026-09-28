import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaChartPie, FaDatabase, FaTools, FaCheckCircle, FaExclamationTriangle,
  FaUsers, FaUserCog, FaFileAlt, FaUpload, FaSignOutAlt, FaChevronDown,
  FaChevronRight, FaBars, FaTimes, FaLayerGroup, FaTruckLoading
} from 'react-icons/fa';

const operationalSections = [
  {
    id: 'overview', label: 'Overview',
    items: [{ key: 'overview', label: 'Operations Overview', icon: <FaChartPie /> }],
  },
  {
    id: 'field-work', label: 'Field Work',
    items: [
      { key: 'records', label: 'Beneficiary Records', icon: <FaDatabase /> },
      { key: 'installation', label: 'Installation Orders', icon: <FaTools /> },
      { key: 'completed', label: 'Completed Installs', icon: <FaCheckCircle /> },
      { key: 'complaints', label: 'Complaints & Rework', icon: <FaExclamationTriangle /> },
    ],
  },
  {
    id: 'materials', label: 'Materials',
    items: [{ key: 'material-receipts', label: 'Inbound Material', icon: <FaTruckLoading /> }],
  },
  {
    id: 'team', label: 'Team',
    items: [{ key: 'technician-summary', label: 'Technician Summary', icon: <FaUsers /> }],
  },
  {
    id: 'data', label: 'Data',
    items: [{ key: 'upload', label: 'Bulk Excel Upload', icon: <FaUpload />, route: '/upload' }],
  },
];

const governanceSection = {
  id: 'administration', label: 'Administration',
  items: [
    { key: 'users', label: 'User Management', icon: <FaUserCog /> },
    { key: 'requests', label: 'Admin Requests', icon: <FaFileAlt /> },
  ],
};

export default function AgencySidebar({ role, activeTab, setActiveTab, collapsed, setCollapsed, onLogout, onResetSelection }) {
  const navigate = useNavigate();
  const sections = useMemo(() => role === 'superadmin' ? [...operationalSections, governanceSection] : operationalSections, [role]);
  const activeKey = activeTab === 'farmer-detail' ? 'records' : activeTab;
  const activeSection = sections.find(section => section.items.some(item => item.key === activeKey))?.id || sections[0]?.id;
  const [openSection, setOpenSection] = useState(activeSection);

  const choose = (item) => {
    if (item.route) navigate(item.route);
    else setActiveTab(item.key);
    onResetSelection?.();
  };

  return (
    <aside className={`agency-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="agency-sidebar__brand">
        <div className="agency-sidebar__mark">O</div>
        {!collapsed && <div className="agency-sidebar__brandcopy"><strong>Opsynq</strong><span>Agency Operations</span></div>}
        <button className="agency-sidebar__collapse" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <FaBars /> : <FaTimes />}
        </button>
      </div>

      {!collapsed && <div className="agency-sidebar__context"><FaLayerGroup/><div><span>Workspace</span><strong>{role === 'superadmin' ? 'Agency Control Center' : 'Agency Operations'}</strong></div></div>}

      <nav className="agency-sidebar__nav" aria-label="Agency workspace navigation">
        {sections.map(section => {
          const expanded = collapsed || openSection === section.id || activeSection === section.id;
          return <div className={`agency-nav-section ${activeSection === section.id ? 'has-active' : ''}`} key={section.id}>
            {!collapsed && <button className="agency-nav-section__head" onClick={() => setOpenSection(openSection === section.id ? '' : section.id)}>
              <span>{section.label}</span>{expanded ? <FaChevronDown/> : <FaChevronRight/>}
            </button>}
            {expanded && <div className="agency-nav-section__items">
              {section.items.map(item => <button key={item.key} title={collapsed ? item.label : undefined} className={`agency-nav-item ${activeKey === item.key ? 'is-active' : ''}`} onClick={() => choose(item)}>
                <span className="agency-nav-item__icon">{item.icon}</span>{!collapsed && <span>{item.label}</span>}
              </button>)}
            </div>}
          </div>;
        })}
      </nav>

      <div className="agency-sidebar__account">
        {!collapsed && <div className="agency-sidebar__accountcopy"><strong>{localStorage.getItem('username') || 'Agency User'}</strong><span>{role === 'superadmin' ? 'Agency Superadmin' : 'Agency Admin'}</span></div>}
        <button className="agency-sidebar__logout" title="Sign out" onClick={onLogout}><FaSignOutAlt/>{!collapsed && <span>Sign out</span>}</button>
      </div>

      {collapsed && <button className="agency-sidebar__reopen" onClick={() => setCollapsed(false)} aria-label="Expand agency navigation"><FaChevronRight/></button>}
    </aside>
  );
}
