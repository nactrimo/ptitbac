var socket = io();
var playerId;
var room_id; // Variable pour stocker l'ID de la salle actuelle
var player_name;

// Function Create game
function createGame() {
    
    fetch('/start_game', {   // Effectue une requête POST vers '/start_game' pour démarrer la partie
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        room_id = data.room_id; // Enregistre l'ID de la salle et affiche les info
        document.getElementById('room_id_display').innerText = room_id;
        document.getElementById('letter').innerText = data.letter;


        

        const responseFieldsDiv = document.getElementById('response_fields'); // Génère les champs de réponse pour chaque catégorie retournée par le serveur
        responseFieldsDiv.innerHTML = '';
        data.categories.forEach(category => {
            responseFieldsDiv.innerHTML += `
                <label for="${category}">${category}:</label>
                <input type="text" id="${category}" placeholder="Enter response for ${category}">
                <br>
            `;
        });
        alert('Voici le n° de la room : ' + room_id + '\nLa lettre est : ' + data.letter);
        // Masquer le formulaire de création/join et afficher la zone de jeu
        //document.getElementById('create_join').style.display = 'none';
        //document.getElementById('game_area').style.display = 'block';


    })
    .catch(error => {
        console.error('Error starting game:', error);
    });
}



// Function JoinGame
function joinGame() {
    var player_name = document.getElementById('player_name').value;
    var room_id_input = document.getElementById('room_id').value; // Utiliser l'entrée de l'utilisateur pour room_id

    fetch('/join_game', { // Envoie les informations au serveur pour rejoindre la salle
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room_id: room_id_input, player_name: player_name }) // Utiliser room_id_input ici
    })
    .then(response => response.json())
    .then(data => {
        if (data.player_id) {
            playerId = data.player_id;
            room_id = data.room_id;
            
            document.getElementById('room_id_display').innerText = room_id;
            document.getElementById('letter').innerText = data.letter;
            // Génère les champs de réponse pour chaque catégorie retournée par le serveur
            const responseFieldsDiv = document.getElementById('response_fields');
            responseFieldsDiv.innerHTML = '';
            data.categories.forEach(category => {
                responseFieldsDiv.innerHTML += `
                    <label for="${category}">${category}:</label>
                    <input type="text" id="${category}" placeholder="Enter response for ${category}">
                    <br>
                `;
            });

            // Cache le formulaire de création/join et affiche la zone de jeu
            document.getElementById('create_join').style.display = 'none';
            document.getElementById('game_area').style.display = 'block';
            socket.emit('join', { room_id: room_id, player_name: player_name });  // Émet un événement 'join' au serveur socket.io pour indiquer la connexion du joueur à la salle
        } else {
            alert('Room not found');
        }
    })
    .catch(error => {
        console.error('Error joining game:', error);
    });
}

// Function submitResponse
function submitResponse() {
    var responses = {};
    document.querySelectorAll('#response_fields input').forEach(input => {
        responses[input.id] = input.value;
    });
    socket.emit('submit_response', { room_id: room_id, player_id: playerId, responses: responses });
}

// Function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// Function leaveGame
function leaveGame() {
    var player_name = document.getElementById('player_name').value;
    socket.emit('leave', { room_id: room_id, player_name: player_name });
    document.getElementById('create_join').style.display = 'block';
    document.getElementById('game_area').style.display = 'none';
}




socket.on('update_responses', function(responses) {
    var responsesDiv = document.getElementById('responses');
    var player_name = document.getElementById('player_name').value;
    responsesDiv.innerHTML = '';
    for (var playerId in responses) {
        if (responses.hasOwnProperty(playerId)) {
            var playerResponses = responses[playerId];
            var responseText = `<p><strong>Réponses de ${escapeHtml(playerId)}:</strong></p>`;
            for (var category in playerResponses) {
                if (playerResponses.hasOwnProperty(category)) {
                    var response = playerResponses[category];
                    responseText += `<p>${escapeHtml(category)}: ${escapeHtml(response)}</p>`;
                }
            }
            responsesDiv.innerHTML += responseText;
        }
    }
});

socket.on('invalid_response', function(data) {
    alert('Invalid response: ' + data.error);
});

socket.on('update_players', function(players) {
    var playersList = document.getElementById('players_list');
    playersList.innerHTML = '<p><strong>Players in the Room:</strong></p>';
    players.forEach(player => {
        playersList.innerHTML += `<p>${player}</p>`;
    });
});

