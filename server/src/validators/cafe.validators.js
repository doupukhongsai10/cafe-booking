const { z } = require('zod');

const registerCafeSchema = z.object({
  name: z.string().min(1, 'Café name is required.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  location: z.string().min(1, 'Location address is required.'),
  city: z.string().min(1, 'City is required.'),
  area: z.string().min(1, 'Area is required.'),
  latitude: z.preprocess((val) => parseFloat(val), z.number().min(-90).max(90)),
  longitude: z.preprocess((val) => parseFloat(val), z.number().min(-180).max(180)),
  operatingHours: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return null;
        }
      }
      return val;
    },
    z.record(
      z.string(),
      z.object({
        open: z.string(), // e.g. "09:00"
        close: z.string(), // e.g. "22:00"
        closed: z.boolean().default(false),
      })
    )
  ),
});

const rejectCafeSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters long.'),
});

module.exports = { registerCafeSchema, rejectCafeSchema };
