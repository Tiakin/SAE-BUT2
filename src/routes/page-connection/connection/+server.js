import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import { saveUserData, clearAllData } from "$lib/store.js";
import {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
} from "$env/static/private";

export async function POST({ request }) {
  const { email_utilisateur, mdp_utilisateur } = await request.json();

  try {
    // Connexion à la base de données
    const db = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      connectTimeout: 5000,
    });

    // Vérifie si l'email existe
    const [rows] = await db.query(
      "SELECT * FROM utilisateur WHERE email_utilisateur = ?",
      [email_utilisateur]
    );
    if (rows.length > 0) {
      // Récupération du mdp en BD
      const [rows] = await db.query(
        "SELECT mdp_utilisateur FROM utilisateur WHERE email_utilisateur = ?",
        [email_utilisateur]
      );

      const { mdp_utilisateur: hashedPasswordFromBD } = rows[0];

      //comparaison des 2 mdp haché
      if (await bcrypt.compare(mdp_utilisateur, hashedPasswordFromBD)) {
        //Enregisstrement des donnée de l'utilisateur dans le local storage
        const [rows] = await db.query(
          "SELECT nom_utilisateur,id_utilisateur FROM utilisateur WHERE email_utilisateur = ?",
          [email_utilisateur]
        );

        await db.end();
        return new Response(
          JSON.stringify({
            message: "Connecté ! Redirection...",
            email_utilisateur: email_utilisateur,
            pseudo: rows[0]?.nom_utilisateur,
            id: rows[0]?.id_utilisateur,
          }),
          { status: 201 }
        );
      } else {
        await db.end();
        return new Response(
          JSON.stringify({ message: "Mot de passe incorrect" }),
          { status: 400 }
        );
      }
    } else {
      await db.end();
      return new Response(
        JSON.stringify({ message: "Cet email est lié a aucun compte" }),
        { status: 400 }
      );
    }
  } catch (error) {
    return new Response(JSON.stringify({ message: "Erreur serveur." }), {
      status: 500,
    });
  }
}
