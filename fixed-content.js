document.addEventListener("DOMContentLoaded", function () {
    var apiKey = 'ba80457d55f715f33efeac6051ccbf3a90a72853fdff01064c6d1cb558eca2f1';  // Tu API Key
    var apiURL = 'https://apiv2.allsportsapi.com/football/';

    // Lista de ligas importantes con su respectivo id (IDs de la API)
    var importantLeaguesIDs = [
        302, // La Liga
        148, // Premier League
        207, // Serie A
        175, // Bundesliga
        168, // Ligue 1
        3,   // Champions League
        5,   // Europa League
        15,  // UEFA Nations League
        6,   // World Cup
        11,  // Eliminatorias CONMEBOL
        12,  // Eliminatorias CONCACAF
        // Añadir más ligas o competiciones importantes si es necesario
    ];

    // IDs de competiciones de selecciones nacionales
    var nationalTeamsCompetitions = [6, 11, 12, 15];  // World Cup, Eliminatorias CONMEBOL, Eliminatorias CONCACAF, UEFA Nations League

    // Función para obtener la fecha actual en formato yyyy-mm-dd
    function getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];  // Formato de la API
    }

    // Función para evitar caché (forzar nuevas respuestas de la API)
    function noCacheParam() {
        return "&_=" + new Date().getTime();  // Agregar timestamp a la petición
    }

    // Función para obtener los partidos importantes del día actual
    function getImportantMatches() {
        const today = getTodayDate();

        // Hacemos una petición por cada liga importante
        let requests = importantLeaguesIDs.map(leagueId => {
            return fetch(apiURL + "?met=Fixtures&APIkey=" + apiKey + "&from=" + today + "&to=" + today + "&leagueId=" + leagueId + noCacheParam())
                .then(response => response.json());
        });

        // Ejecutamos todas las peticiones y combinamos los resultados
        Promise.all(requests)
            .then(responses => {
                let allMatches = [];

                // Unimos todos los partidos de las ligas importantes
                responses.forEach(response => {
                    if (response.result && Array.isArray(response.result)) {
                        allMatches = allMatches.concat(response.result);
                    }
                });

                if (allMatches.length > 0) {
                    // Filtrar los partidos por categorías (selecciones primero)
                    let nationalTeamMatches = allMatches.filter(match => nationalTeamsCompetitions.includes(parseInt(match.league_id)));
                    let otherMatches = allMatches.filter(match => !nationalTeamsCompetitions.includes(parseInt(match.league_id)));

                    // Concatenamos partidos de selecciones primero, luego otros partidos
                    let sortedMatches = nationalTeamMatches.concat(otherMatches);

                    // Ordenar partidos cronológicamente por hora
                    sortedMatches.sort((a, b) => a.event_time.localeCompare(b.event_time));
                    
                    // Mostrar los partidos filtrados
                    displayMatches(sortedMatches);
                } else {
                    // Mostrar mensaje si no hay partidos destacados
                    displayNoMatchesMessage();
                }
            })
            .catch(error => {
                console.error('Error al obtener los datos:', error);
                displayNoMatchesMessage();  // Mostrar mensaje en caso de error
            });
    }

    // Función para mostrar los partidos
    function displayMatches(matches) {
        var left1 = document.querySelector('.fixed-content-left-1');
        var left2 = document.querySelector('.fixed-content-left-2');
        var right1 = document.querySelector('.fixed-content-right-1');
        var right2 = document.querySelector('.fixed-content-right-2');

        // Limpiar contenido previo
        [left1, left2, right1, right2].forEach(function (el) {
            if (el) el.innerHTML = "";
        });

        // Mostrar partidos en los 4 contenedores (máximo 4 partidos)
        matches.slice(0, 4).forEach(function (match, index) {
            var container = [left1, left2, right1, right2][index];
            if (container) {
                var homeTeam = match.event_home_team || 'Indefinido';
                var awayTeam = match.event_away_team || 'Indefinido';
                var homeTeamLogo = match.home_team_logo || '';  // Logo del equipo local
                var awayTeamLogo = match.away_team_logo || '';  // Logo del equipo visitante
                var date = formatDate(match.event_date);  // Formatear fecha
                var time = formatTime(match.event_time);  // Formatear hora

                // URL que incluye liga, equipos y fecha del partido
                var matchURL = `widgetMatchResults.html?${match.league_name}/${match.event_home_team}-vs-${match.event_away_team}/${match.event_date}/${match.event_key}`;

                var matchLabel = `
                    <img src="${homeTeamLogo}" alt="${homeTeam}" class="team-logo">
                    ${homeTeam} vs
                    <img src="${awayTeamLogo}" alt="${awayTeam}" class="team-logo">
                    ${awayTeam}
                    <br>
                    <span>Fecha: ${date}</span> | <span>Hora: ${time}</span>
                `;

                // Insertar el link con el formato adecuado
                container.innerHTML = `<a href="${matchURL}">${matchLabel}</a>`;
            }
        });
    }

    // Función para mostrar mensaje cuando no hay partidos
    function displayNoMatchesMessage() {
        var left1 = document.querySelector('.fixed-content-left-1');
        var left2 = document.querySelector('.fixed-content-left-2');
        var right1 = document.querySelector('.fixed-content-right-1');
        var right2 = document.querySelector('.fixed-content-right-2');

        var message = "No hay partidos importantes programados para hoy.";

        // Mostrar mensaje en cada contenedor
        [left1, left2, right1, right2].forEach(function (el) {
            if (el) el.innerHTML = `<p>${message}</p>`;
        });
    }

    // Función para formatear la fecha (visualización)
    function formatDate(dateString) {
        if (!dateString) return 'Fecha no disponible';  // Control de valores nulos

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Fecha no disponible';  // Fechas inválidas

        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Función para formatear la hora
    function formatTime(timeString) {
        if (!timeString) return 'Hora no disponible';  // Control de valores nulos

        const [hours, minutes] = timeString.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return 'Hora no disponible';  // Control de valores inválidos

        // Mostrar formato de 24 horas
        return new Date(0, 0, 0, hours, minutes).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Función para actualizar automáticamente los partidos cada 60 segundos
    function autoUpdateMatches() {
        getImportantMatches();  // Obtiene los partidos importantes
        setTimeout(autoUpdateMatches, 60000);  // Actualiza cada 60 segundos
    }

    // Iniciar actualización automática al cargar la página
    autoUpdateMatches();
});
