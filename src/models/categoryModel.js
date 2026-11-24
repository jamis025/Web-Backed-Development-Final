import db from '../config/db.js';

export const getAllCategories = async () => {
  const res = await db.query('SELECT * FROM categories ORDER BY name ASC;');
  return res.rows;
};

export const createCategory = async ({ name, description }) => {
  await db.query('INSERT INTO categories (name, description) VALUES ($1, $2);', [name, description]);
};

export const updateCategory = async ({ categoryId, name, description }) => {
  await db.query('UPDATE categories SET name = $1, description = $2 WHERE category_id = $3;', [
    name,
    description,
    categoryId,
  ]);
};

export const deleteCategory = async (categoryId) => {
  await db.query('DELETE FROM categories WHERE category_id = $1;', [categoryId]);
};
