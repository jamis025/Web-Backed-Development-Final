import db from '../config/db.js';

export const createMessage = async ({ senderName, senderEmail, subject, message }) => {
  await db.query(
    'INSERT INTO contact_messages (sender_name, sender_email, subject, message) VALUES ($1, $2, $3, $4);',
    [senderName, senderEmail, subject, message]
  );
};

export const getAllMessages = async () => {
  const res = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC;');
  return res.rows;
};

export const toggleMessageResolved = async (messageId) => {
  await db.query(
    'UPDATE contact_messages SET is_resolved = NOT is_resolved WHERE message_id = $1;',
    [messageId]
  );
};
