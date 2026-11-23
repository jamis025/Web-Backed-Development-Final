import db from '../config/db.js';

export const getFeaturedVehicles = async () => {
  const sql = `
    SELECT v.*, c.name AS category_name,
      (SELECT image_url FROM vehicle_images WHERE vehicle_id = v.vehicle_id AND is_primary = TRUE LIMIT 1) AS primary_image
    FROM vehicles v
    LEFT JOIN categories c ON v.category_id = c.category_id
    WHERE v.is_featured = TRUE AND v.is_available = TRUE
    ORDER BY v.created_at DESC;
  `;
  const result = await db.query(sql);
  return result.rows;
};

export const getFilteredVehicles = async ({ categoryId, maxPrice, search }) => {
  const params = [];
  const conditions = ['v.is_available = TRUE'];

  if (categoryId) {
    params.push(categoryId);
    conditions.push(`v.category_id = $${params.length}`);
  }
  if (maxPrice) {
    params.push(maxPrice);
    conditions.push(`v.price <= $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(v.make ILIKE $${params.length} OR v.model ILIKE $${params.length})`);
  }

  const sql = `
    SELECT v.*, c.name AS category_name,
      (SELECT image_url FROM vehicle_images WHERE vehicle_id = v.vehicle_id AND is_primary = TRUE LIMIT 1) AS primary_image
    FROM vehicles v
    LEFT JOIN categories c ON v.category_id = c.category_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY v.created_at DESC;
  `;
  const result = await db.query(sql, params);
  return result.rows;
};

export const getVehicleById = async (vehicleId) => {
  const vehicleSql = `
    SELECT v.*, c.name AS category_name
    FROM vehicles v
    LEFT JOIN categories c ON v.category_id = c.category_id
    WHERE v.vehicle_id = $1;
  `;
  const imagesSql = `SELECT * FROM vehicle_images WHERE vehicle_id = $1 ORDER BY is_primary DESC;`;

  const [vehicleRes, imagesRes] = await Promise.all([
    db.query(vehicleSql, [vehicleId]),
    db.query(imagesSql, [vehicleId]),
  ]);

  if (vehicleRes.rows.length === 0) return null;
  return { ...vehicleRes.rows[0], images: imagesRes.rows };
};
