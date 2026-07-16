const { z } = require('zod');

const TableZoneEnum = z.enum(['INDOOR', 'OUTDOOR', 'ROOFTOP', 'PRIVATE']);

const createTableSchema = z.object({
  name: z.string().min(1, 'Table name is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  zone: TableZoneEnum.default('INDOOR'),
  description: z.string().min(1, 'Description is required'),
});

const updateTableSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().min(1).optional(),
  zone: TableZoneEnum.optional(),
  description: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

const updateHoursSchema = z.record(
  z.string(),
  z.object({
    open: z.string(), // e.g. "08:00"
    close: z.string(), // e.g. "22:00"
    closed: z.boolean().default(false),
  })
);

module.exports = {
  createTableSchema,
  updateTableSchema,
  updateHoursSchema,
};
