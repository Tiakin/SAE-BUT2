import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
} from "$env/static/private";

export async function POST({ request }) {
  try {
    const userData = await request.json();

    //const { type, email, pseudo, current_password, new_password, confirm_password, id } = body;

    // Connexion à la base de données
    const db = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      connectTimeout: 5000,
    });

    if (userData.type === "update-info") {
      // Vérifie si l'email existe déjà dans la base de données
      const [existingEmail] = await db.query(
        "SELECT email_utilisateur FROM utilisateur WHERE email_utilisateur = ? AND email_utilisateur != (SELECT email_utilisateur FROM utilisateur WHERE id_utilisateur = ?)",
        [userData.email, userData.id]
      );

      if (existingEmail.length > 0) {
        await db.end();
        return new Response(
          JSON.stringify({ message: "Email already exists" }),
          { status: 400 }
        );
      }

      // Vérifie si le pseudo existe déjà dans la base de données (insensible à la casse)
      const [existingPseudo] = await db.query(
        "SELECT nom_utilisateur FROM utilisateur WHERE LOWER(nom_utilisateur) = LOWER(?) AND id_utilisateur != ?",
        [userData.pseudo, userData.id]
      );

      if (existingPseudo.length > 0) {
        await db.end();
        return new Response(
          JSON.stringify({ message: "Pseudo already exists" }),
          { status: 400 }
        );
      }

      // Récupération du mot de passe actuel depuis la base de données
      const [rows] = await db.query(
        "SELECT mdp_utilisateur FROM utilisateur WHERE id_utilisateur = ?",
        [userData.id]
      );

      if (rows.length === 0) {
        await db.end();
        return new Response(
          JSON.stringify({ message: "Utilisateur introuvable." }),
          { status: 404 }
        );
      }

      const hashedPassword = rows[0].mdp_utilisateur;

      // Vérifie si le mot de passe actuel est correct
      const isPasswordValid = await bcrypt.compare(
        userData.password,
        hashedPassword
      );

      if (!isPasswordValid) {
        await db.end();
        return new Response(JSON.stringify({ message: "Wrong password" }), {
          status: 400,
        });
      }

      // Met à jour les informations utilisateur (pseudo ou email)
      await db.query(
        "UPDATE utilisateur SET nom_utilisateur = ?, email_utilisateur = ? WHERE id_utilisateur = ?",
        [userData.pseudo, userData.email, userData.id]
      );

      await db.end();
      return new Response(
        JSON.stringify({ message: "Informations mises à jour avec succès." }),
        { status: 200 }
      );
    }

    if (userData.type === "update-password") {
      // Récupération du mot de passe actuel depuis la base de données
      const [rows] = await db.query(
        "SELECT mdp_utilisateur FROM utilisateur WHERE id_utilisateur = ?",
        [userData.id]
      );

      if (rows.length === 0) {
        await db.end();
        return new Response(
          JSON.stringify({ message: "Utilisateur introuvable." }),
          { status: 404 }
        );
      }

      const hashedPassword = rows[0].mdp_utilisateur;

      // Vérifie si le mot de passe actuel est correct
      const isPasswordValid = await bcrypt.compare(
        userData.password,
        hashedPassword
      );

      if (!isPasswordValid) {
        await db.end();
        return new Response(
          JSON.stringify({ message: "Mot de passe actuel incorrect." }),
          { status: 400 }
        );
      }

      // Hache le nouveau mot de passe
      const newHashedPassword = await bcrypt.hash(userData.new_password, 10);

      // Met à jour le mot de passe dans la base de données
      await db.query(
        "UPDATE utilisateur SET mdp_utilisateur = ? WHERE id_utilisateur = ?",
        [newHashedPassword, userData.id]
      );

      await db.end();
      return new Response(
        JSON.stringify({ message: "Mot de passe mis à jour avec succès." }),
        { status: 200 }
      );
    }

    // Cas non géré
    await db.end();
    return new Response(
      JSON.stringify({ message: "Type de requête invalide." }),
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur serveur:", error);
    return new Response(
      JSON.stringify({
        message: "Erreur serveur. Veuillez réessayer plus tard.",
      }),
      { status: 500 }
    );
  }
}
