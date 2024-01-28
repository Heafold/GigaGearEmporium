require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function connectDB() {
    try {
        await mongoose.connect(process.env.DB_MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connecté à MongoDB');
    } catch (error) {
        console.error('Erreur de connexion à MongoDB:', error);
        process.exit(1);
    }
}

async function createAdminUser() {
    try {
        const adminExists = await Admin.findOne({ username: 'admin' });
        if (adminExists) {
            console.log('Un utilisateur admin existe déjà.');
            return;
        }

        const admin = new Admin({
            username: 'admin',
            password: '123123'
        });

        await admin.save();
        console.log('Compte administrateur créé avec succès!');
    } catch (error) {
        console.error('Erreur lors de la création du compte administrateur:', error);
    } finally {
        mongoose.disconnect();
    }
}

async function main() {
    await connectDB();
    await createAdminUser();
}

main();
