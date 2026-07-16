const { createStaffUser, getCafeStaff, deleteStaffRecord } = require('../services/staff.service');
const zod = require('zod');

const createStaffSchema = zod.object({
  name: zod.string().min(2, 'Name must be at least 2 characters.'),
  email: zod.string().email('Invalid email address.'),
  password: zod.string().min(6, 'Password must be at least 6 characters.'),
});

async function registerStaff(req, res) {
  const { id: cafeId } = req.params;
  const payload = createStaffSchema.parse(req.body);
  const staff = await createStaffUser(cafeId, req.user.id, payload);
  return res.status(201).json({ data: { staff } });
}

async function listStaff(req, res) {
  const { id: cafeId } = req.params;
  const staff = await getCafeStaff(cafeId, req.user.id);
  return res.status(200).json({ data: { staff } });
}

async function removeStaff(req, res) {
  const { id: cafeId, staffId } = req.params;
  const result = await deleteStaffRecord(cafeId, staffId, req.user.id);
  return res.status(200).json({ data: result });
}

module.exports = {
  registerStaff,
  listStaff,
  removeStaff,
};
