# Gestion MongoDB - Interface CRUD

Application web moderne pour gérer vos documents MongoDB avec une interface utilisateur intuitive.

## 🚀 Installation

1. Installer les dépendances :
```bash
npm install
```

2. Créer un fichier `.env` à la racine du projet :
```env
MONGO_DB=mongodb://localhost:27017/ma_base_de_donnees
PORT=3000
```

Pour MongoDB Atlas :
```env
MONGO_DB=mongodb+srv://username:password@cluster.mongodb.net/database
PORT=3000
```

## 📖 Utilisation

### Démarrer le serveur
```bash
npm start
```

Le serveur démarre sur `http://localhost:3000` (ou le port spécifié dans `.env`)

### Accéder à l'interface
Ouvrez votre navigateur et allez sur : `http://localhost:3000`

## ✨ Fonctionnalités

- ✅ **CREATE** : Créer de nouveaux documents
- 📖 **READ** : Afficher tous les documents
- ✏️ **UPDATE** : Modifier un document complet
- 📅 **UPDATE DATE** : Modifier uniquement la date d'expiration
- 🗑️ **DELETE** : Supprimer un document

## 🎨 Interface

L'interface comprend :
- Formulaire de création avec validation
- Liste des documents avec badges de statut
- Modal de modification complète
- Modal de modification de date uniquement
- Actions rapides (Modifier, Modifier date, Supprimer)
- Messages de confirmation/erreur
- Design moderne et responsive

## 📝 Structure des données

```json
{
  "nom": "ELOLA Abdou",
  "telephone": "76391454",
  "dateExpiration": "2026-10-10T00:00:00.000Z",
  "heureExpiration": "23:59",
  "actif": true,
  "createdAt": "2025-10-17T14:32:45.384Z",
  "updatedAt": "2025-10-17T14:32:45.384Z"
}
```
# GPT
