const { validatePassword } = require('../../utils/passwordSecurity');
const bcrypt = require('bcryptjs');
const Organization = require('../../models/platform/Organization');
const PlatformUser = require('../../models/platform/PlatformUser');
const LegacyUser = require('../../models/User');
const Program = require('../../models/platform/Program');
const WorkOrder = require('../../models/platform/WorkOrder');
const WorkPackage = require('../../models/platform/WorkPackage');
const BeneficiaryContext = require('../../models/platform/BeneficiaryContext');
const InventorySerial = require('../../models/platform/InventorySerial');
const Shipment = require('../../models/platform/Shipment');
const ServiceCase = require('../../models/platform/ServiceCase');
const CommercialClaim = require('../../models/platform/CommercialClaim');
const ComplianceRecord = require('../../models/platform/ComplianceRecord');
const platformAudit = require('../../utils/platformAudit');

const companyFilter = { type: 'COMPANY' };
const allowedCompanyRoles = ['company_owner','company_admin','operations_manager','program_manager','inventory_manager','procurement_manager','finance_user','quality_user','logistics_manager','viewer'];

exports.summary = async (req, res) => {
  const [total, active, pending, suspended, users, programs, workOrders, workPackages] = await Promise.all([
    Organization.countDocuments(companyFilter),
    Organization.countDocuments({ ...companyFilter, status: 'ACTIVE' }),
    Organization.countDocuments({ ...companyFilter, status: 'PENDING' }),
    Organization.countDocuments({ ...companyFilter, status: 'SUSPENDED' }),
    PlatformUser.countDocuments({ role: { $ne: 'platform_superadmin' } }),
    Program.countDocuments({}), WorkOrder.countDocuments({}), WorkPackage.countDocuments({}),
  ]);
  res.json({ companies: { total, active, pending, suspended }, users, programs, workOrders, workPackages });
};


exports.portfolio = async (req, res) => {
  const activeCompanyIds = await Organization.find({ type:'COMPANY', status:'ACTIVE' }).distinct('_id');
  const [beneficiaries, packagesByStatus, serialByStatus, shipmentByStatus, serviceBySla, claims, complianceByStatus, topCompanies] = await Promise.all([
    BeneficiaryContext.countDocuments({ companyId:{ $in:activeCompanyIds } }),
    WorkPackage.aggregate([{ $match:{ companyId:{ $in:activeCompanyIds } } },{ $group:{ _id:'$status', count:{ $sum:1 }, quantity:{ $sum:'$assignedQuantity' } } },{ $sort:{ count:-1 } }]),
    InventorySerial.aggregate([{ $match:{ companyId:{ $in:activeCompanyIds } } },{ $group:{ _id:'$status', count:{ $sum:1 } } },{ $sort:{ count:-1 } }]),
    Shipment.aggregate([{ $match:{ companyId:{ $in:activeCompanyIds } } },{ $group:{ _id:'$status', count:{ $sum:1 } } },{ $sort:{ count:-1 } }]),
    ServiceCase.aggregate([{ $match:{ companyId:{ $in:activeCompanyIds }, status:{ $nin:['CLOSED','CANCELLED'] } } },{ $group:{ _id:'$slaState', count:{ $sum:1 } } }]),
    CommercialClaim.aggregate([{ $match:{ companyId:{ $in:activeCompanyIds } } },{ $group:{ _id:null, gross:{ $sum:'$grossAmount' }, approved:{ $sum:'$approvedAmount' }, paid:{ $sum:'$paidAmount' }, blocked:{ $sum:'$blockedAmount' } } }]),
    ComplianceRecord.aggregate([{ $match:{ companyId:{ $in:activeCompanyIds } } },{ $group:{ _id:'$status', count:{ $sum:1 } } }]),
    BeneficiaryContext.aggregate([{ $match:{ companyId:{ $in:activeCompanyIds } } },{ $group:{ _id:'$companyId', beneficiaries:{ $sum:1 } } },{ $sort:{ beneficiaries:-1 } },{ $limit:8 },{ $lookup:{ from:'organizations', localField:'_id', foreignField:'_id', as:'company' } },{ $unwind:{ path:'$company', preserveNullAndEmptyArrays:true } },{ $project:{ _id:1, beneficiaries:1, name:'$company.name', code:'$company.code' } }])
  ]);
  const service = Object.fromEntries(serviceBySla.map(x=>[x._id||'UNKNOWN',x.count]));
  const compliance = Object.fromEntries(complianceByStatus.map(x=>[x._id||'UNKNOWN',x.count]));
  const money = claims[0] || { gross:0, approved:0, paid:0, blocked:0 };
  const inFlight = packagesByStatus.filter(x=>['READY','ASSIGNED','IN_PROGRESS','BLOCKED'].includes(x._id)).reduce((n,x)=>n+x.count,0);
  const delayed = packagesByStatus.filter(x=>x._id==='BLOCKED').reduce((n,x)=>n+x.count,0);
  res.json({
    beneficiaries,
    workPackages:{ inFlight, delayed, byStatus:packagesByStatus },
    inventory:{ byStatus:serialByStatus },
    logistics:{ byStatus:shipmentByStatus },
    service:{ ...service, open:Object.values(service).reduce((a,b)=>a+b,0) },
    claims:money,
    compliance,
    topCompanies
  });
};

exports.list = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 25));
  const q = String(req.query.q || '').trim();
  const status = String(req.query.status || '').trim().toUpperCase();
  const filter = { ...companyFilter };
  if (status && ['PENDING','ACTIVE','SUSPENDED','ARCHIVED'].includes(status)) filter.status = status;
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { code: new RegExp(q, 'i') }, { 'contact.name': new RegExp(q, 'i') }, { 'contact.mobile': new RegExp(q, 'i') }];
  const [items, total] = await Promise.all([
    Organization.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Organization.countDocuments(filter),
  ]);
  res.json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
};

exports.getOne = async (req, res) => {
  const company = await Organization.findOne({ _id: req.params.id, type: 'COMPANY' }).lean();
  if (!company) return res.status(404).json({ message: 'Company not found.' });
  const [users, programs, workOrders, workPackages] = await Promise.all([
    PlatformUser.find({ organizationId: company._id }).select('-password').sort({ createdAt: -1 }).lean(),
    Program.find({ companyId: company._id }).sort({ createdAt: -1 }).lean(),
    WorkOrder.find({ companyId: company._id }).sort({ createdAt: -1 }).lean(),
    WorkPackage.find({ companyId: company._id }).sort({ createdAt: -1 }).lean(),
  ]);
  res.json({ company, users, programs, workOrders, workPackages });
};

exports.create = async (req, res) => {
  const { name, code, country = 'India', state, contact = {}, address = {} } = req.body;
  if (!name || !code) return res.status(400).json({ message: 'Name and code are required.' });
  const company = await Organization.create({ name: name.trim(), code: String(code).trim().toUpperCase(), type: 'COMPANY', country, state, contact, address, status: 'ACTIVE' });
  await platformAudit(req, { companyId: company._id, organizationId: company._id, action: 'COMPANY_CREATED', entityType: 'Organization', entityId: company._id, after: company.toObject() });
  res.status(201).json({ company });
};

exports.update = async (req, res) => {
  const company = await Organization.findOne({ _id: req.params.id, type: 'COMPANY' });
  if (!company) return res.status(404).json({ message: 'Company not found.' });
  const before = company.toObject();
  const editable = ['name','country','state','contact','address','metadata'];
  editable.forEach((field) => { if (req.body[field] !== undefined) company[field] = req.body[field]; });
  await company.save();
  await platformAudit(req, { companyId: company._id, organizationId: company._id, action: 'COMPANY_UPDATED', entityType: 'Organization', entityId: company._id, before, after: company.toObject() });
  res.json({ company });
};

exports.setStatus = async (req, res) => {
  const status = String(req.body.status || '').toUpperCase();
  if (!['PENDING','ACTIVE','SUSPENDED','ARCHIVED'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });
  const company = await Organization.findOne({ _id: req.params.id, type: 'COMPANY' });
  if (!company) return res.status(404).json({ message: 'Company not found.' });
  const before = company.status;
  company.status = status;
  await company.save();
  await PlatformUser.updateMany({ organizationId: company._id }, { $set: { approvalStatus: status === 'ACTIVE' ? 'APPROVED' : (status === 'PENDING' ? 'PENDING' : 'REJECTED'), isActive: status === 'ACTIVE' } });
  await platformAudit(req, { companyId: company._id, organizationId: company._id, action: 'COMPANY_STATUS_CHANGED', entityType: 'Organization', entityId: company._id, before: { status: before }, after: { status }, reason: req.body.reason });
  res.json({ company });
};

exports.createCompanyUser = async (req, res) => {
  const company = await Organization.findOne({ _id: req.params.id, type: 'COMPANY', status: 'ACTIVE' });
  if (!company) return res.status(404).json({ message: 'Active company not found.' });
  const { name, email, mobile, password, role = 'viewer' } = req.body;
  if (!name || !email || !mobile || !password || !allowedCompanyRoles.includes(role)) return res.status(400).json({ message: 'Valid name, email, mobile, password and company role are required.' });
  const existing = await PlatformUser.findOne({ $or: [{ mobile: String(mobile).trim() }, ...(email ? [{ email: String(email).trim().toLowerCase() }] : [])] });
  if (existing) return res.status(409).json({ message: 'Mobile/email already exists.' });
  const user = await PlatformUser.create({ name, email: email?.trim().toLowerCase(), mobile: String(mobile).trim(), password: await bcrypt.hash(password, 12), role, organizationId: company._id, approvalStatus: 'APPROVED', isActive: true });
  await platformAudit(req, { companyId: company._id, organizationId: company._id, action: 'COMPANY_USER_CREATED', entityType: 'PlatformUser', entityId: user._id, after: { name: user.name, role: user.role, mobile: user.mobile } });
  const safe = user.toObject(); delete safe.password;
  res.status(201).json({ user: safe });
};


exports.updateCompanyUser = async (req, res) => {
  const company = await Organization.findOne({ _id:req.params.id, type:'COMPANY' });
  if (!company) return res.status(404).json({ message:'Company not found.' });
  const user = await PlatformUser.findOne({ _id:req.params.userId, organizationId:company._id, role:{ $ne:'platform_superadmin' } });
  if (!user) return res.status(404).json({ message:'Company user not found.' });
  const before = { name:user.name, email:user.email, mobile:user.mobile, role:user.role, isActive:user.isActive };
  const { name,email,mobile,role,isActive,password } = req.body;
  if (role !== undefined && !allowedCompanyRoles.includes(role)) return res.status(400).json({ message:'Invalid company role.' });
  if (mobile !== undefined || email !== undefined) {
    const clauses=[];
    if (mobile) clauses.push({ mobile:String(mobile).trim() });
    if (email) clauses.push({ email:String(email).trim().toLowerCase() });
    if (clauses.length) {
      const [duplicate, legacyDuplicate]=await Promise.all([PlatformUser.findOne({ _id:{ $ne:user._id }, $or:clauses }),LegacyUser.findOne({$or:clauses}).select('_id').lean()]);
      if (duplicate || legacyDuplicate) return res.status(409).json({ message:'Mobile/email already exists.' });
    }
  }
  if (name !== undefined) user.name=String(name).trim();
  if (email !== undefined) user.email=email?String(email).trim().toLowerCase():undefined;
  if (mobile !== undefined) user.mobile=String(mobile).trim();
  if (role !== undefined) user.role=role;
  if (typeof isActive === 'boolean') user.isActive=isActive;
  if (password) {
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.ok) return res.status(400).json({ message: passwordCheck.message });
    user.password=await bcrypt.hash(String(password),12);
    user.passwordChangedAt=new Date();
    user.tokenVersion=Number(user.tokenVersion||0)+1;
  }
  await user.save();
  await platformAudit(req,{ companyId:company._id, organizationId:company._id, action:'COMPANY_USER_UPDATED', entityType:'PlatformUser', entityId:user._id, before, after:{ name:user.name,email:user.email,mobile:user.mobile,role:user.role,isActive:user.isActive } });
  const safe=user.toObject(); delete safe.password;
  res.json({ user:safe });
};
