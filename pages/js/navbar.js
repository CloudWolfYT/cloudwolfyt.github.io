$(function () {
    var bar = '';
    bar += '<div class="navbar">';
    bar += '<a href="../../index.html">Home</a>';
    bar += '<div class="dropdown">';
    bar += '<button class="dropbtn">JS Scripts <i class="arrow down"></i></button>';
    bar += '<div class="dropdown-content">';
    bar += '<a href="block-id.html">Block ID Packager</a>';
    bar += '<a href="image-json.html">Image to JSON Text</a>';
    bar += '<a href="ender-crafter.html">Ender-Crafter Recipes</a>';
    bar += '<a href="typewriter.html">Typewriter Text</a>';
    bar += '<a href="score-trees.html">Scoreboard Trees</a>';
    bar += '</div></div></div>';

    $("#main-bar").html(bar);

    var id = getValueByName("id");
    $("#" + id).addClass("active");
});

function getValueByName(name) {
    var url = document.getElementById('nav-bar').getAttribute('src');
    var param = new Array();
    if (url.indexOf("?") != -1) {
        var source = url.split("?")[1];
        items = source.split("&");
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var parameters = item.split("=");
            if (parameters[0] == "id") {
                return parameters[1];
            }
        }
    }
}