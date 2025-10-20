import mysql from "mysql2/promise";
import { json } from "@sveltejs/kit";
import {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
} from "$env/static/private";

const dbConfig = {
  host: MYSQL_HOST,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  connectTimeout: 5000,
};

async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

export async function GET({ url }) {
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return json({ error: "User not connected" }, { status: 401 });
  }

  const db = await getConnection();

  try {
    const [rows] = await db.query(
      "SELECT * FROM raccourci WHERE id_utilisateur = ?",
      [userId]
    );
    return json(rows);
  } catch (error) {
    return json({ error: "Database error" }, { status: 500 });
  } finally {
    await db.end();
  }
}

export async function POST({ request }) {
  const { userId, label, lien } = await request.json();
  if (!userId) {
    return json({ error: "User not connected" }, { status: 401 });
  }

  const db = await getConnection();

  try {
    const [result] = await db.query(
      "INSERT INTO raccourci (label, lien, id_utilisateur) VALUES (?, ?, ?)",
      [label, lien, userId]
    );
    return json({ id: result.insertId });
  } catch (error) {
    return json({ error: "Database error" }, { status: 500 });
  } finally {
    await db.end();
  }
}

export async function PUT({ request }) {
  const { id, label, lien, userId } = await request.json();
  if (!userId) {
    return json({ error: "User not connected" }, { status: 401 });
  }

  const db = await getConnection();

  try {
    await db.query(
      "UPDATE raccourci SET label = ?, lien = ? WHERE id_raccourci = ? AND id_utilisateur = ?",
      [label, lien, id, userId]
    );
    return json({ success: true });
  } catch (error) {
    return json({ error: "Database error" }, { status: 500 });
  } finally {
    await db.end();
  }
}

export async function DELETE({ url }) {
  const id = url.searchParams.get("id");
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return json({ error: "User not connected" }, { status: 401 });
  }

  const db = await getConnection();

  try {
    await db.query(
      "DELETE FROM raccourci WHERE id_raccourci = ? AND id_utilisateur = ?",
      [id, userId]
    );
    return json({ success: true });
  } catch (error) {
    return json({ error: "Database error" }, { status: 500 });
  } finally {
    await db.end();
  }
}
