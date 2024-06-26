var socket = io();
var playerId;
var room_id; // Variable pour stocker l'ID de la salle actuelle


function createGame() {

    fetch('/start_game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        room_id = data.room_id; // Enregistre l'ID de la salle
        document.getElementById('room_id_display').innerText = room_id;
        document.getElementById('letter').innerText = data.letter;

        const responseFieldsDiv = document.getElementById('response_fields');
        responseFieldsDiv.innerHTML = '';
        data.categories.forEach(category => {
            responseFieldsDiv.innerHTML += `
                <label for="${category}">${category}:</label>
                <input type="text" id="${category}" placeholder="Enter response for ${category}">
                <br>
            `;
        });

        // Masquer le formulaire de création/join et afficher la zone de jeu
        document.getElementById('create_join').style.display = 'none';
        document.getElementById('game_area').style.display = 'block';


    })
    .catch(error => {
        console.error('Error starting game:', error);
    });
}




function joinGame() {
    var player_name = document.getElementById('player_name').value;
    var room_id_input = document.getElementById('room_id').value; // Utiliser l'entrée de l'utilisateur pour room_id
    fetch('/join_game', {
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
            
            const responseFieldsDiv = document.getElementById('response_fields');
            responseFieldsDiv.innerHTML = '';
            data.categories.forEach(category => {
                responseFieldsDiv.innerHTML += `
                    <label for="${category}">${category}:</label>
                    <input type="text" id="${category}" placeholder="Enter response for ${category}">
                    <br>
                `;
            });

            document.getElementById('create_join').style.display = 'none';
            document.getElementById('game_area').style.display = 'block';
            socket.emit('join', { room_id: room_id, player_name: player_name });
        } else {
            alert('Room not found');
        }
    })
    .catch(error => {
        console.error('Error joining game:', error);
    });
}


function submitResponse() {
    var responses = {};
    document.querySelectorAll('#response_fields input').forEach(input => {
        responses[input.id] = input.value;
    });
    socket.emit('submit_response', { room_id: room_id, player_id: playerId, responses: responses });
}

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
            var responseText = `<p>Player ${player_name}:</p>`;
            for (var category in playerResponses) {
                if (playerResponses.hasOwnProperty(category)) {
                    var response = playerResponses[category];
                    responseText += `<p>${category}: ${response}</p>`;
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

