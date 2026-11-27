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
export const getAllVehiclesAdmin = async () => {
  const sql = `
    SELECT v.*, c.name AS category_name
    FROM vehicles v
    LEFT JOIN categories c ON v.category_id = c.category_id
    ORDER BY v.created_at DESC;
  `;
  const res = await db.query(sql);
  return res.rows;
};

export const createVehicle = async ({
  categoryId, make, model, year, price, mileage, color, transmission, description, isFeatured, imageUrl,
}) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const vRes = await client.query(
      `INSERT INTO vehicles (category_id, make, model, year, price, mileage, color, transmission, description, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING vehicle_id;`,
      [categoryId || null, make, model, year, price, mileage, color, transmission, description, Boolean(isFeatured)]
    );
    const vehicleId = vRes.rows.vehicle_id;

    if (imageUrl) {
      await client.query(
        'INSERT INTO vehicle_images (vehicle_id, image_url, is_primary) VALUES ($1, $2, TRUE);',
        [vehicleId, imageUrl]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const updateVehicleEmployee = async ({ vehicleId, price, description, isAvailable }) => {
  await db.query(
    'UPDATE vehicles SET price = $1, description = $2, is_available = $3 WHERE vehicle_id = $4;',
    [price, description, Boolean(isAvailable), vehicleId]
  );
};

export const deleteVehicle = async (vehicleId) => {
  await db.query('DELETE FROM vehicles WHERE vehicle_id = $1;', [vehicleId]);
};
