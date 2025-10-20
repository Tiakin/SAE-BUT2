import { createTransport } from "nodemailer";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import { onMount } from "svelte";
import {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
} from "$env/static/private";

export async function POST({ request }) {
  const { email, token, password } = await request.json();

  const db = await mysql.createConnection({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    connectTimeout: 5000,
  });

  const currentUrl = request.url;
  const url = new URL("/page-connection/recovery", currentUrl)
    .toString()
    .replace("https://", "http://");

  if (token && password) {
    // partie NewPassword

    const [rows] = await db.query(
      "SELECT * FROM changement_mdp WHERE token = ?",
      [token]
    );
    if (rows.length == 0) {
      await db.end();
      return new Response(JSON.stringify({ message: "Token invalide" }), {
        status: 400,
      });
    }
    if (rows[0].date_expiration < new Date()) {
      await db.end();
      return new Response(JSON.stringify({ message: "Token expiré" }), {
        status: 400,
      });
    }
    if (rows[0].utilise) {
      await db.end();
      return new Response(JSON.stringify({ message: "Token déjà utilisé" }), {
        status: 400,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "UPDATE utilisateur SET mdp_utilisateur = ? WHERE email_utilisateur = ?",
      [hashedPassword, rows[0].email_utilisateur]
    );
    await db.query("UPDATE changement_mdp SET utilise = ? WHERE token = ?", [
      true,
      token,
    ]);
    await db.end();
    return new Response(
      JSON.stringify({ message: "Mot de passe mis à jour avec succès" }),
      { status: 201 }
    );
  } else if (email) {
    // partie SendMail

    const [rows] = await db.query(
      "SELECT * FROM utilisateur WHERE email_utilisateur = ?",
      [email]
    );
    if (rows.length == 0) {
      await db.end();
      return new Response(
        JSON.stringify({ message: "L'adresse mail n'existe pas dans la base" }),
        { status: 404 }
      );
    }

    const [rows2] = await db.query(
      "SELECT * FROM changement_mdp WHERE email_utilisateur = ? AND utilise = ? AND date_expiration > ?",
      [email, false, new Date()]
    );
    if (rows2.length > 0) {
      await db.end();
      return new Response(
        JSON.stringify({
          message: "Un mail de récupération vous a déjà été envoyé",
        }),
        { status: 400 }
      );
    } else {
      const token =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      const now = new Date();
      const expirationDate = new Date(now.getTime() + 3600000);

      await db.query(
        "INSERT INTO changement_mdp (email_utilisateur, token, date_creation, date_expiration, utilise) VALUES (?, ?, ?, ?, ?)",
        [email, token, now, expirationDate, false]
      );

      await db.end();
      try {
        let transporter = createTransport({
          service: "gmail",
          auth: {
            user: "user@gmail.com",
            pass: "pass",
          },
        });

        let mailOptions = {
          from: '"SmartDesk" <tiakin69@gmail.com>',
          to: email,
          subject: "Changement de mot de passe",
          text:
            "Cliquez ici pour changer de mot de passe : " +
            url +
            "?token=" +
            token,
        };

        transporter.sendMail(mailOptions, (error) => {
          if (error) {
            return new Response(
              JSON.stringify({ message: "Une erreur est survenue" }),
              { status: 500 }
            );
          }
        });

        return new Response(
          JSON.stringify({
            message: "Un mail de récupération vous a été envoyé",
          }),
          { status: 201 }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ message: "Une erreur est survenue" }),
          { status: 500 }
        );
      }
    }
  }
}
