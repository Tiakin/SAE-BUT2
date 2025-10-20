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
  const db = await getConnection();

  try {
    const [rows] = await db.query(
      "SELECT * FROM widget WHERE id_utilisateur = ?",
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
  const widget = await request.json();
  const db = await getConnection();

  try {
    const [result] = await db.query(
      "INSERT INTO widget (type, contenu, position, id_utilisateur) VALUES (?, ?, ?, ?)",
      [widget.type, widget.template, widget.position, widget.id_utilisateur]
    );
    return json({ id: result.insertId });
  } catch (error) {
    return json({ error: "Database error" }, { status: 500 });
  } finally {
    await db.end();
  }
}

export async function PUT({ request }) {
  const widget = await request.json();
  const db = await getConnection();

  try {
    const query = `
            UPDATE widget 
            SET position = ?,
                contenu = COALESCE(?, contenu),
                type = COALESCE(?, type)
            WHERE id_widget = ?
        `;

    await db.query(query, [
      widget.position,
      widget.contenu || widget.template,
      widget.type,
      widget.id_widget,
    ]);

    console.log("Updated widget:", widget);
    return json({ success: true });
  } catch (error) {
    console.error("Update error:", error);
    return json({ error: "Database error" }, { status: 500 });
  } finally {
    await db.end();
  }
}

export async function DELETE({ url }) {
  const widgetId = url.searchParams.get("id");
  const db = await getConnection();

  try {
    await db.query("DELETE FROM widget WHERE id_widget = ?", [widgetId]);
    return json({ success: true });
  } catch (error) {
    return json({ error: "Database error" }, { status: 500 });
  } finally {
    await db.end();
  }
}
