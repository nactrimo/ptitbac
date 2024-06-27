# Utilisez l'image Python officielle en tant que base
FROM python:3.12

# Définissez le répertoire de travail dans le conteneur
WORKDIR /docker/ptibac

# Copiez le fichier des dépendances Python
COPY requirements.txt .

# Installez les dépendances Python
RUN pip install -r requirements.txt

# Copiez tout le contenu local dans le répertoire de travail de l'image
COPY . .

# Exposez le port que Flask écoute
EXPOSE 5000

# Commande par défaut pour exécuter votre application
CMD ["python", "app.py"]
