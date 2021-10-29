//Gibt den Pfad zu einem zufälligen favicon zurück
$(() => {
    $("#favicon").attr("href", "assets/sprites/favicons/favicon (" + Math.ceil(Math.random() * 28) + ").png");
});