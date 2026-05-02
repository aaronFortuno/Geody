export type UILocale = "ca" | "es" | "en";

type MessageKey =
  | "app.connecting"
  | "home.title"
  | "home.subtitle"
  | "home.create"
  | "home.join"
  | "home.version.close"
  | "home.version.meta"
  | "home.version.includes"
  | "home.version.nextFocus"
  | "home.version.github"
  | "home.version.license"
  | "home.version.changelog"
  | "home.version.portfolio"
  | "home.version.tips"
  | "home.version.tipsMessage"
  | "home.language"
  | "lobby.room"
  | "lobby.waitingHost"
  | "lobby.joinRoom"
  | "lobby.roomCode"
  | "lobby.yourName"
  | "lobby.placeholderName"
  | "lobby.joinButton"
  | "host.roomCode"
  | "host.start"
  | "host.copy"
  | "host.players"
  | "host.kick"
  | "host.config"
  | "host.mode"
  | "host.mode.countries"
  | "host.mode.capitals"
  | "host.mode.both"
  | "host.gameType"
  | "host.gameType.fastest"
  | "host.gameType.kahoot"
  | "host.rounds"
  | "host.timePerRound"
  | "host.guessLabel.untilRound"
  | "host.guessLabel.seconds"
  | "host.continents"
  | "host.continent.africa"
  | "host.continent.asia"
  | "host.continent.europe"
  | "host.continent.northAmerica"
  | "host.continent.southAmerica"
  | "host.continent.oceania"
  | "host.selectAll"
  | "host.unselectAll"
  | "host.allowAnswerChange"
  | "host.autoRotate"
  | "host.keepLabelUntilRoundEnd"
  | "game.round"
  | "game.room"
  | "game.reveal"
  | "game.end"
  | "game.nextRound"
  | "game.waitingTeacher"
  | "game.scoreboard"
  | "game.answer.placeholder"
  | "game.answer.correct"
  | "game.answer.incorrect"
  | "game.answer.submit"
  | "results.finalTitle"
  | "results.fullRanking"
  | "results.points"
  | "results.correctAnswers"
  | "results.streak"
  | "results.backToLobby"
  | "results.waitingHost"
  | "results.correctAnswer";

type Messages = Record<MessageKey, string>;

export const messages: Record<UILocale, Messages> = {
  ca: {
    "app.connecting": "Connectant amb el servidor...",
    "home.title": "Geody",
    "home.subtitle": "El joc de geografia per a aules",
    "home.create": "Crear Sala",
    "home.join": "Unir-se a una Sala",
    "home.version.close": "Tancar",
    "home.version.meta": "Versio {version} - {date}",
    "home.version.includes": "Inclou",
    "home.version.nextFocus": "Seguent focus",
    "home.version.github": "Repositori GitHub",
    "home.version.license": "Llicencia {license}",
    "home.version.changelog": "Historial de versions",
    "home.version.portfolio": "Portfolio",
    "home.version.tips": "Propina Lightning",
    "home.version.tipsMessage":
      "Tots els meus projectes son open source. Si t'ha agradat o t'ha aportat valor, pots ajudar compartint-lo o, si vols, deixar una propina via LN.",
    "home.language": "Idioma",
    "lobby.room": "Sala",
    "lobby.waitingHost": "Esperant que el professor inicii la partida...",
    "lobby.joinRoom": "Unir-se a una sala",
    "lobby.roomCode": "Codi de sala",
    "lobby.yourName": "El teu nom",
    "lobby.placeholderName": "Nom",
    "lobby.joinButton": "Unir-se",
    "host.roomCode": "Codi de sala",
    "host.start": "Iniciar",
    "host.copy": "Copiar",
    "host.players": "Jugadors",
    "host.kick": "Expulsar",
    "host.config": "Configuracio",
    "host.mode": "Mode",
    "host.mode.countries": "Paisos",
    "host.mode.capitals": "Capitals",
    "host.mode.both": "Mixt",
    "host.gameType": "Tipus de joc",
    "host.gameType.fastest": "Rapid",
    "host.gameType.kahoot": "Kahoot",
    "host.rounds": "Rondes: {value}",
    "host.timePerRound": "Temps per ronda: {value}s",
    "host.guessLabel.untilRound": "Etiqueta resposta: fins final de ronda",
    "host.guessLabel.seconds": "Etiqueta resposta: {value}s",
    "host.continents": "Continents",
    "host.continent.africa": "Africa",
    "host.continent.asia": "Asia",
    "host.continent.europe": "Europa",
    "host.continent.northAmerica": "America del Nord",
    "host.continent.southAmerica": "America del Sud",
    "host.continent.oceania": "Oceania",
    "host.selectAll": "Seleccionar tots",
    "host.unselectAll": "Deseleccionar tots",
    "host.allowAnswerChange": "Permetre canvi de resposta",
    "host.autoRotate": "Auto-rotar globus",
    "host.keepLabelUntilRoundEnd": "Mantenir etiqueta fins final de ronda",
    "game.round": "Ronda",
    "game.room": "Sala",
    "game.reveal": "Mostrar Resposta",
    "game.end": "Finalitzar Partida",
    "game.nextRound": "Seguent Ronda",
    "game.waitingTeacher": "Esperant el professor...",
    "game.scoreboard": "Classificacio",
    "game.answer.placeholder": "Escriu la resposta",
    "game.answer.correct": "Correcte! +{points}",
    "game.answer.incorrect": "Incorrecte",
    "game.answer.submit": "Enviar",
    "results.finalTitle": "Resultats finals",
    "results.fullRanking": "Classificacio completa",
    "results.points": "{value} pts",
    "results.correctAnswers": "{value} encerts",
    "results.streak": "Ratxa {value}",
    "results.backToLobby": "Tornar al Lobby",
    "results.waitingHost": "Esperant que el professor torni al lobby...",
    "results.correctAnswer": "Resposta correcta"
  },
  es: {
    "app.connecting": "Conectando con el servidor...",
    "home.title": "Geody",
    "home.subtitle": "El juego de geografia para aulas",
    "home.create": "Crear Sala",
    "home.join": "Unirse a una Sala",
    "home.version.close": "Cerrar",
    "home.version.meta": "Version {version} - {date}",
    "home.version.includes": "Incluye",
    "home.version.nextFocus": "Siguiente foco",
    "home.version.github": "Repositorio GitHub",
    "home.version.license": "Licencia {license}",
    "home.version.changelog": "Historial de versiones",
    "home.version.portfolio": "Portfolio",
    "home.version.tips": "Propina Lightning",
    "home.version.tipsMessage":
      "Todos mis proyectos son open source. Si te ha gustado o te ha aportado valor, puedes ayudar compartiendolo o, si quieres, dejar una propina por LN.",
    "home.language": "Idioma",
    "lobby.room": "Sala",
    "lobby.waitingHost": "Esperando a que el profesor inicie la partida...",
    "lobby.joinRoom": "Unirse a una sala",
    "lobby.roomCode": "Codigo de sala",
    "lobby.yourName": "Tu nombre",
    "lobby.placeholderName": "Nombre",
    "lobby.joinButton": "Unirse",
    "host.roomCode": "Codigo de sala",
    "host.start": "Iniciar",
    "host.copy": "Copiar",
    "host.players": "Jugadores",
    "host.kick": "Expulsar",
    "host.config": "Configuracion",
    "host.mode": "Modo",
    "host.mode.countries": "Paises",
    "host.mode.capitals": "Capitales",
    "host.mode.both": "Mixto",
    "host.gameType": "Tipo de juego",
    "host.gameType.fastest": "Rapido",
    "host.gameType.kahoot": "Kahoot",
    "host.rounds": "Rondas: {value}",
    "host.timePerRound": "Tiempo por ronda: {value}s",
    "host.guessLabel.untilRound": "Etiqueta respuesta: hasta fin de ronda",
    "host.guessLabel.seconds": "Etiqueta respuesta: {value}s",
    "host.continents": "Continentes",
    "host.continent.africa": "Africa",
    "host.continent.asia": "Asia",
    "host.continent.europe": "Europa",
    "host.continent.northAmerica": "America del Norte",
    "host.continent.southAmerica": "America del Sur",
    "host.continent.oceania": "Oceania",
    "host.selectAll": "Seleccionar todos",
    "host.unselectAll": "Deseleccionar todos",
    "host.allowAnswerChange": "Permitir cambio de respuesta",
    "host.autoRotate": "Auto-rotar globo",
    "host.keepLabelUntilRoundEnd": "Mantener etiqueta hasta fin de ronda",
    "game.round": "Ronda",
    "game.room": "Sala",
    "game.reveal": "Mostrar Respuesta",
    "game.end": "Finalizar Partida",
    "game.nextRound": "Siguiente Ronda",
    "game.waitingTeacher": "Esperando al profesor...",
    "game.scoreboard": "Clasificacion",
    "game.answer.placeholder": "Escribe la respuesta",
    "game.answer.correct": "Correcto! +{points}",
    "game.answer.incorrect": "Incorrecto",
    "game.answer.submit": "Enviar",
    "results.finalTitle": "Resultados finales",
    "results.fullRanking": "Clasificacion completa",
    "results.points": "{value} pts",
    "results.correctAnswers": "{value} aciertos",
    "results.streak": "Racha {value}",
    "results.backToLobby": "Volver al Lobby",
    "results.waitingHost": "Esperando a que el profesor vuelva al lobby...",
    "results.correctAnswer": "Respuesta correcta"
  },
  en: {
    "app.connecting": "Connecting to server...",
    "home.title": "Geody",
    "home.subtitle": "The geography game for classrooms",
    "home.create": "Create Room",
    "home.join": "Join Room",
    "home.version.close": "Close",
    "home.version.meta": "Version {version} - {date}",
    "home.version.includes": "Includes",
    "home.version.nextFocus": "Next focus",
    "home.version.github": "GitHub Repository",
    "home.version.license": "{license} License",
    "home.version.changelog": "Version history",
    "home.version.portfolio": "Portfolio",
    "home.version.tips": "Lightning tip",
    "home.version.tipsMessage":
      "All my projects are open source. If you liked this one or it gave you value, sharing it helps a lot, and you can also send a tip via LN.",
    "home.language": "Language",
    "lobby.room": "Room",
    "lobby.waitingHost": "Waiting for teacher to start the game...",
    "lobby.joinRoom": "Join a room",
    "lobby.roomCode": "Room code",
    "lobby.yourName": "Your name",
    "lobby.placeholderName": "Name",
    "lobby.joinButton": "Join",
    "host.roomCode": "Room code",
    "host.start": "Start",
    "host.copy": "Copy",
    "host.players": "Players",
    "host.kick": "Kick",
    "host.config": "Settings",
    "host.mode": "Mode",
    "host.mode.countries": "Countries",
    "host.mode.capitals": "Capitals",
    "host.mode.both": "Mixed",
    "host.gameType": "Game type",
    "host.gameType.fastest": "Fastest",
    "host.gameType.kahoot": "Kahoot",
    "host.rounds": "Rounds: {value}",
    "host.timePerRound": "Time per round: {value}s",
    "host.guessLabel.untilRound": "Answer label: until round end",
    "host.guessLabel.seconds": "Answer label: {value}s",
    "host.continents": "Continents",
    "host.continent.africa": "Africa",
    "host.continent.asia": "Asia",
    "host.continent.europe": "Europe",
    "host.continent.northAmerica": "North America",
    "host.continent.southAmerica": "South America",
    "host.continent.oceania": "Oceania",
    "host.selectAll": "Select all",
    "host.unselectAll": "Unselect all",
    "host.allowAnswerChange": "Allow answer change",
    "host.autoRotate": "Auto-rotate globe",
    "host.keepLabelUntilRoundEnd": "Keep label until round end",
    "game.round": "Round",
    "game.room": "Room",
    "game.reveal": "Reveal Answer",
    "game.end": "End Game",
    "game.nextRound": "Next Round",
    "game.waitingTeacher": "Waiting for teacher...",
    "game.scoreboard": "Scoreboard",
    "game.answer.placeholder": "Type your answer",
    "game.answer.correct": "Correct! +{points}",
    "game.answer.incorrect": "Incorrect",
    "game.answer.submit": "Send",
    "results.finalTitle": "Final results",
    "results.fullRanking": "Full ranking",
    "results.points": "{value} pts",
    "results.correctAnswers": "{value} correct",
    "results.streak": "Streak {value}",
    "results.backToLobby": "Back to Lobby",
    "results.waitingHost": "Waiting for teacher to return to lobby...",
    "results.correctAnswer": "Correct answer"
  }
};

export function formatMessage(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, token: string) =>
    String(params[token] ?? `{${token}}`)
  );
}
