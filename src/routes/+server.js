import mysql from "mysql2/promise";
import {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
} from "$env/static/private";

export async function POST({ request }) {
  try {
    // Get user ID
    const { userId } = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({ message: "User ID is missing." }), {
        status: 400,
      });
    }

    // Create connection to database
    const con = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      connectTimeout: 5000,
    });

    const [rows] = await con.query(
      "SELECT * FROM evenement WHERE id_utilisateur = ?",
      [userId]
    );

    await con.end();

    return new Response(
      JSON.stringify({
        message: "Informations mises à jour avec succès.",
        eventsData: rows,
      }),
      { status: 200 }
    );
  } catch (e) {
    console.error("Error fetching events : " + e);
    await con.end();
  }
}
