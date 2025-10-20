import mysql from "mysql2/promise";
import {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
} from "$env/static/private";

export async function POST({ request }) {
  try {
    // Get data
    const event = await request.json();

    if (!event.userId) {
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

    if (event.action === "createEvent") {
      const [result] = await con.query(
        "INSERT INTO evenement (titre, description, date_debut, date_fin, heure_debut, heure_fin, id_utilisateur) VALUES (?,?,?,?,?,?,?)",
        [
          event.title,
          event.description,
          event.startDate,
          event.endDate,
          event.startTime,
          event.endTime,
          event.userId,
        ]
      );

      await con.end();

      return new Response(
        JSON.stringify({
          message: "Update informations success.",
        }),
        { status: 200 }
      );
    }

    if (event.action === "deleteEvent") {
      const [result] = await con.query(
        "DELETE FROM evenement WHERE id_evenement = ?",
        [event.eventId]
      );

      await con.end();

      return new Response(
        JSON.stringify({
          message: "Update informations success.",
        }),
        { status: 200 }
      );
    }
  } catch (e) {
    console.error("Error fetching events : " + e);
    await con.end();
  }
}
