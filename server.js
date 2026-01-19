require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Connexion à MongoDB
const MONGO_DB = process.env.MONGO_DB;

if (!MONGO_DB) {
  console.error('Erreur: MONGO_DB n\'est pas défini dans le fichier .env');
  process.exit(1);
}

// Définition du schéma User
const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  telephone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  dateExpiration: {
    type: Date,
    required: true
  },
  heureExpiration: {
    type: String,
    required: true
  },
  actif: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Méthode pour vérifier si l'abonnement est expiré
userSchema.methods.isExpired = function() {
  const now = new Date();
  const expiration = new Date(this.dateExpiration);
  
  // Ajouter l'heure d'expiration à la date
  const [hours, minutes] = this.heureExpiration.split(':');
  expiration.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  return now > expiration;
};

// Méthode pour obtenir le temps restant
userSchema.methods.getTimeRemaining = function() {
  const now = new Date();
  const expiration = new Date(this.dateExpiration);
  const [hours, minutes] = this.heureExpiration.split(':');
  expiration.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const diff = expiration - now;
  
  if (diff <= 0) {
    return 'Expiré';
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}j ${hoursLeft}h ${minutesLeft}m`;
  } else {
    return `${hoursLeft}h ${minutesLeft}m`;
  }
};

// Modèle
const User = mongoose.model('User', userSchema);

// Service MongoDB
class MongoService {
  constructor() {
    this.connected = false;
  }

  // Connexion à MongoDB
  async connect() {
    try {
      await mongoose.connect(MONGO_DB);
      this.connected = true;
      console.log('✅ Connecté à MongoDB avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur de connexion à MongoDB:', error.message);
      this.connected = false;
      return false;
    }
  }

  // Déconnexion de MongoDB
  async disconnect() {
    try {
      await mongoose.disconnect();
      this.connected = false;
      console.log('✅ Déconnecté de MongoDB');
    } catch (error) {
      console.error('❌ Erreur de déconnexion:', error.message);
    }
  }

  // CREATE - Créer un nouvel utilisateur
  async create(data) {
    try {
      if (!this.connected) {
        throw new Error('Non connecté à MongoDB');
      }

      const user = new User({
        nom: data.nom,
        telephone: data.telephone,
        dateExpiration: data.dateExpiration ? new Date(data.dateExpiration) : new Date(),
        heureExpiration: data.heureExpiration || '23:59',
        actif: data.actif !== undefined ? data.actif : true
      });

      const savedUser = await user.save();
      // Ajouter les informations d'expiration
      const userObj = savedUser.toObject();
      userObj.isExpired = savedUser.isExpired();
      userObj.timeRemaining = savedUser.getTimeRemaining();
      console.log('✅ Utilisateur créé avec succès');
      return userObj;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Ce numéro de téléphone existe déjà');
      }
      console.error('❌ Erreur lors de la création:', error.message);
      throw error;
    }
  }

  // READ - Récupérer tous les utilisateurs
  async findAll(filter = {}) {
    try {
      if (!this.connected) {
        throw new Error('Non connecté à MongoDB');
      }

      const users = await User.find(filter);
      // Ajouter les informations d'expiration à chaque utilisateur
      const usersWithExpiration = users.map(user => {
        const userObj = user.toObject();
        userObj.isExpired = user.isExpired();
        userObj.timeRemaining = user.getTimeRemaining();
        return userObj;
      });
      console.log(`✅ ${users.length} utilisateur(s) trouvé(s)`);
      return usersWithExpiration;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération:', error.message);
      throw error;
    }
  }

  // READ - Récupérer un utilisateur par ID
  async findById(id) {
    try {
      if (!this.connected) {
        throw new Error('Non connecté à MongoDB');
      }

      const user = await User.findById(id);
      if (!user) {
        console.log('⚠️ Utilisateur non trouvé');
        return null;
      }
      // Ajouter les informations d'expiration
      const userObj = user.toObject();
      userObj.isExpired = user.isExpired();
      userObj.timeRemaining = user.getTimeRemaining();
      console.log('✅ Utilisateur trouvé');
      return userObj;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération:', error.message);
      throw error;
    }
  }

  // UPDATE - Mettre à jour un utilisateur
  async update(id, data) {
    try {
      if (!this.connected) {
        throw new Error('Non connecté à MongoDB');
      }

      // Préparer les données à mettre à jour
      const updateData = { ...data };
      
      // Si dateExpiration est fournie, la convertir en Date
      if (updateData.dateExpiration) {
        updateData.dateExpiration = new Date(updateData.dateExpiration);
      }

      const user = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!user) {
        console.log('⚠️ Utilisateur non trouvé pour la mise à jour');
        return null;
      }

      // Ajouter les informations d'expiration
      const userObj = user.toObject();
      userObj.isExpired = user.isExpired();
      userObj.timeRemaining = user.getTimeRemaining();

      console.log('✅ Utilisateur mis à jour avec succès');
      return userObj;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Ce numéro de téléphone existe déjà');
      }
      console.error('❌ Erreur lors de la mise à jour:', error.message);
      throw error;
    }
  }

  // UPDATE - Mettre à jour la date d'expiration
  async updateDate(id, newDate, newHeure = null) {
    try {
      if (!this.connected) {
        throw new Error('Non connecté à MongoDB');
      }

      const updateData = {
        dateExpiration: new Date(newDate)
      };

      if (newHeure) {
        updateData.heureExpiration = newHeure;
      }

      const user = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!user) {
        console.log('⚠️ Utilisateur non trouvé pour la mise à jour de la date');
        return null;
      }

      // Ajouter les informations d'expiration
      const userObj = user.toObject();
      userObj.isExpired = user.isExpired();
      userObj.timeRemaining = user.getTimeRemaining();

      console.log('✅ Date mise à jour avec succès');
      return userObj;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la date:', error.message);
      throw error;
    }
  }

  // DELETE - Supprimer un utilisateur
  async delete(id) {
    try {
      if (!this.connected) {
        throw new Error('Non connecté à MongoDB');
      }

      const user = await User.findByIdAndDelete(id);
      
      if (!user) {
        console.log('⚠️ Utilisateur non trouvé pour la suppression');
        return null;
      }

      console.log('✅ Utilisateur supprimé avec succès');
      return user;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error.message);
      throw error;
    }
  }
}

// Instance du service
const mongoService = new MongoService();

// Application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes API

// GET - Récupérer tous les utilisateurs
app.get('/api/users', async (req, res) => {
  try {
    const users = await mongoService.findAll();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Récupérer un utilisateur par ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await mongoService.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Créer un nouvel utilisateur
app.post('/api/users', async (req, res) => {
  try {
    const user = await mongoService.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT - Mettre à jour un utilisateur
app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await mongoService.update(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PATCH - Mettre à jour uniquement la date d'expiration
app.patch('/api/users/:id/date', async (req, res) => {
  try {
    const { dateExpiration, heureExpiration } = req.body;
    const user = await mongoService.updateDate(req.params.id, dateExpiration, heureExpiration);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE - Supprimer un utilisateur
app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await mongoService.delete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route pour servir l'interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
async function startServer() {
  try {
    // Se connecter à MongoDB
    const connected = await mongoService.connect();
    if (!connected) {
      console.error('Impossible de se connecter à MongoDB. Arrêt du serveur.');
      process.exit(1);
    }

    // Démarrer Express
    app.listen(PORT, () => {
      console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`📱 Interface disponible: http://localhost:${PORT}\n`);
    });
  } catch (error) {
    console.error('Erreur lors du démarrage:', error);
    process.exit(1);
  }
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n\nArrêt du serveur...');
  await mongoService.disconnect();
  process.exit(0);
});

startServer();
