import db from '../config/db.js';

export const createServiceRequest = async ({ userId, vehicleInfo, serviceType, customerNotes }) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const reqRes = await client.query(
      `INSERT INTO service_requests (user_id, vehicle_info, service_type, customer_notes, status)
       VALUES ($1, $2, $3, $4, 'Submitted') RETURNING *;`,
      [userId, vehicleInfo, serviceType, customerNotes]
    );
    const request = reqRes.rows[0];

    await client.query(
      `INSERT INTO service_status_history (request_id, status, note, changed_by)
       VALUES ($1, 'Submitted', 'Service request submitted by customer.', $2);`,
      [request.request_id, userId]
    );

    await client.query('COMMIT');
    return request;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const updateServiceStatus = async ({ requestId, status, employeeNotes, changedBy }) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE service_requests 
       SET status = $1, employee_notes = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE request_id = $3;`,
      [status, employeeNotes, requestId]
    );

    await client.query(
      `INSERT INTO service_status_history (request_id, status, note, changed_by)
       VALUES ($1, $2, $3, $4);`,
      [requestId, status, employeeNotes || `Status updated to ${status}`, changedBy]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getUserServiceRequests = async (userId) => {
  const sql = `
    SELECT sr.*,
      COALESCE(
        (SELECT json_agg(h ORDER BY h.changed_at ASC)
         FROM service_status_history h
         WHERE h.request_id = sr.request_id), '[]'
      ) AS history
    FROM service_requests sr
    WHERE sr.user_id = $1
    ORDER BY sr.created_at DESC;
  `;
  const result = await db.query(sql, [userId]);
  return result.rows;
};
