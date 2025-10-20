import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
} from "$env/static/private";

export async function POST({ request }) {
  const { email_utilisateur, mdp_utilisateur, nom_utilisateur } =
    await request.json();

  try {
    // Connexion à la base de données
    const db = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      connectTimeout: 5000,
    });

    // Vérifie si l'email existe déjà
    const [rows] = await db.query(
      "SELECT * FROM utilisateur WHERE email_utilisateur = ?",
      [email_utilisateur]
    );
    if (rows.length > 0) {
      await db.end();
      return new Response(
        JSON.stringify({ message: "Cet email est déjà utilisé." }),
        { status: 400 }
      );
    }

    // Vérifie si le pseudo existe déjà dans la base de données (insensible à la casse)
    const [existingPseudo] = await db.query(
      "SELECT nom_utilisateur FROM utilisateur WHERE LOWER(nom_utilisateur) = LOWER(?)",
      [nom_utilisateur]
    );

    if (existingPseudo.length > 0) {
      await db.end();
      return new Response(
        JSON.stringify({ message: "Pseudo already exists" }),
        { status: 400 }
      );
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(mdp_utilisateur, 10);

    // Insère l'utilisateur dans la base de données
    await db.query(
      "INSERT INTO utilisateur (email_utilisateur, mdp_utilisateur, nom_utilisateur) VALUES (?, ?, ?)",
      [email_utilisateur, hashedPassword, nom_utilisateur]
    );

    await db.end();
    return new Response(
      JSON.stringify({
        message: "Utilisateur créé avec succès. Redirection...",
      }),
      { status: 201 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ message: "Erreur serveur." }), {
      status: 500,
    });
  }
}
