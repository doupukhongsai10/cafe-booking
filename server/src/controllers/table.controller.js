const { createTableSchema, updateTableSchema, updateHoursSchema } = require('../validators/table.validators');
const { createTable, getTables, updateTable, deleteTable, updateHours } = require('../services/table.service');

async function addTable(req, res) {
  const { id } = req.params;
  const payload = createTableSchema.parse(req.body);

  const table = await createTable(id, req.user.id, payload);

  return res.status(201).json({ data: { table } });
}

async function listTables(req, res) {
  const { id } = req.params;

  const tables = await getTables(id);

  return res.status(200).json({ data: { tables } });
}

async function editTable(req, res) {
  const { id, tableId } = req.params;
  const payload = updateTableSchema.parse(req.body);

  const table = await updateTable(id, tableId, req.user.id, payload);

  return res.status(200).json({ data: { table } });
}

async function removeTable(req, res) {
  const { id, tableId } = req.params;

  const table = await deleteTable(id, tableId, req.user.id);

  return res.status(200).json({ data: { table } });
}

async function setHours(req, res) {
  const { id } = req.params;
  const payload = updateHoursSchema.parse(req.body);

  const cafe = await updateHours(id, req.user.id, payload);

  return res.status(200).json({ data: { cafe } });
}

module.exports = {
  addTable,
  listTables,
  editTable,
  removeTable,
  setHours,
};
