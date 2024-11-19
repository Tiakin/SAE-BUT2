import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';


export async function POST({ request }) {
    const { email_utilisateur, mdp_utilisateur } = await request.json();

    try {
        // Connexion à la base de données
        const db = await mysql.createConnection({
            host: '85.215.130.37',
            user: 'SAE2',
            password: 'Zao@67.pomme', 
            database: 'smartdesk',    
            connectTimeout: 5000 
        });

        // Vérifie si l'email existe
        const [rows] = await db.query('SELECT * FROM utilisateur WHERE email_utilisateur = ?', [email_utilisateur]);
        console.log("oui");
        if (rows.length > 0) {
            
            // Récupération du mdp en BD
            const [rows] = await db.query(
                'SELECT mdp_utilisateur FROM utilisateur WHERE email_utilisateur = ?',
                [email_utilisateur]
            );

            const  { mdp_utilisateur: hashedPasswordFromBD }= rows[0]

            //comparaison des 2 mdp haché
            if (await bcrypt.compare(mdp_utilisateur, hashedPasswordFromBD)) {


                await db.end();
                return new Response(JSON.stringify({ message: 'Connecté !' }), { status: 201 });
            } else {
                await db.end();
                return new Response(JSON.stringify({ message: 'MDP Incorrect' }), { status: 400 });
            }
            
        } else {
            
            await db.end();
            return new Response(JSON.stringify({ message: 'Cet email est lié a aucun compte' }), { status: 400 });
        }

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ message: 'Erreur serveur.' }), { status: 500 });
    }
}
