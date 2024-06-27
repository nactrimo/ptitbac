from flask import Flask, request, jsonify, render_template
from flask_socketio import SocketIO, join_room, leave_room, send, emit
from markupsafe import escape
import random
import string
import unicodedata

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app)

# Stockage des parties
rooms = {}

# Chemin vers les fichiers de catégories
categories_files = {
    "Animaux": "mots/animaux.txt",
    "Pays": "mots/pays.txt",
    "Fruits": "mots/fruits.txt",
    "Départements": "mots/Departement.txt",
    "Capitale": "mots/Capitale.txt",
    "Prénoms": "mots/prenoms.txt"
}

# Fonction pour normaliser une chaîne de caractères (en minuscules, sans accents)
def normalize_string(s):
    if s is None:
        return ''
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if c in string.ascii_lowercase)



# Fonction pour obtenir une lettre aléatoire
def obtenir_lettre_aleatoire():
    return random.choice(string.ascii_uppercase)

# Fonction pour générer un code de salle aléatoire
def generate_room_id():
    letters = ''.join(random.choices(string.ascii_uppercase, k=2))
    numbers = ''.join(random.choices(string.digits, k=2))
    return f"{letters}{numbers}"

# Fonction pour lire les mots d'une catégorie
def lire_mots(categorie):
    with open(categories_files[categorie], 'r') as file:
        return [line.strip() for line in file.readlines()]

# Fonction pour obtenir des catégories aléatoires
def obtenir_categories_aleatoires(n=3):
    return random.sample(list(categories_files.keys()), n)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/start_game', methods=['POST'])
def start_game():
    room_id = generate_room_id()
    letter = obtenir_lettre_aleatoire()
    categories = obtenir_categories_aleatoires()
    rooms[room_id] = {
        "letter": letter,
        "categories": categories,
        "players": {},
        "responses": {}
    }
    return jsonify({"room_id": room_id, "letter": letter, "categories": categories})

@app.route('/join_game', methods=['POST'])
def join_game():
    room_id = request.json.get('room_id')
    player_name = escape(request.json.get('player_name'))
    if room_id in rooms:
        player_id = len(rooms[room_id]['players']) + 1
        rooms[room_id]['players'][player_id] = player_name
        socketio.emit('update_players', list(rooms[room_id]['players'].values()), room=room_id)  # Notify all players about the updated player list
        return jsonify({
            "player_id": player_id,
            "room_id": room_id,
            "letter": rooms[room_id]['letter'],
            "categories": rooms[room_id]['categories']
        })
    return jsonify({"error": "Room not found"}), 404



@socketio.on('submit_response')
def handle_response(data):
    room_id = data.get('room_id')
    player_id = data.get('player_id')
    responses = data.get('responses')
    
    if room_id in rooms and player_id in rooms[room_id]['players']:
        valid_responses = {}
        for category, response in responses.items():
            normalized_response = normalize_string(response)
            if normalized_response:
                words_in_category = [normalize_string(word) for word in lire_mots(category)]
                
                if normalized_response in words_in_category:
                    valid_responses[category] = escape(response)
        
        rooms[room_id]['responses'][player_id] = valid_responses
        updated_responses = rooms[room_id]['responses']
        emit('update_responses', updated_responses, room=room_id)
    else:
        emit('invalid_response', {"error": "Invalid room or player"})


@socketio.on('join')
def on_join(data):
    room_id = data['room_id']
    player_name = data['player_name']
    join_room(room_id)
    send(f'{player_name} has entered the room.', room=room_id)
    
    # Envoyer la liste des joueurs mis à jour à tous les clients de la salle
    socketio.emit('update_players', list(rooms[room_id]['players'].values()), room=room_id)


@socketio.on('leave')
def on_leave(data):
    room_id = data['room_id']
    player_name = data['player_name']
    leave_room(room_id)
    send(f'{player_name} has left the room.', room=room_id)
    
    # Supprimer le joueur de la salle
    for player_id, name in rooms[room_id]['players'].items():
        if name == player_name:
            del rooms[room_id]['players'][player_id]
            break
    
    # Envoyer la liste des joueurs mise à jour à tous les clients de la salle
    socketio.emit('update_players', list(rooms[room_id]['players'].values()), room=room_id)




if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
