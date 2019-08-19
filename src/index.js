import Court from './court';
import Shots from './shots';
import Qbutton from './qbutton';
import Pie from './pie';

const CONSTANTS = {
    courtWidth: 500,
    courtHeight: 470,
    defaultSeason: "2017"
}

document.addEventListener("DOMContentLoaded", () => {
    const searchfield = document.querySelector("input");

    searchfield.oninput = (event) => {
        event.target.value === "" ? clearPlayerMenuResults() : debounceSearch(event);
    };
});

const debounce = (func, delay) => {    
    let timeoutId;

    return (newArgs) => {
        const args = newArgs.target.value;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(args), delay);
    }
}

const debounceSearch = debounce((event) => playerMenu(event, CONSTANTS.defaultSeason), 300);

export function clearChart() {
    d3.select("svg").remove();
}

export function drawChart(playerName, season, date, period) {    
    clearChart();
    clearPies();

    let svg = d3.select("#svgcontainer")
        .append("svg").attr("width", CONSTANTS.courtWidth).attr("height", CONSTANTS.courtHeight);
    
    const court = new Court(svg);
    court.render();

    new Shots(svg, playerName, season, date, period);

}

function clearPlayerMenuResults() {
    d3.selectAll(".searchresults li").remove();
}

function clearSearch(playerName) {
    d3.selectAll(".searchfield")
        .property("value", "")
        .property("placeholder", playerName)
}

function playerMenu(searchText, season) {
    clearPlayerMenuResults();

    d3.csv(`../dataset/${season}.csv`)
        .then(function (data) {
            const searchLength = searchText.length;
            let players = {};

            data.forEach(player => {
                if ( player.name.slice(0, searchLength).toLowerCase() === searchText.toLowerCase() 
                    && Object.keys(players).length <= 6 && !Object.keys(players).includes(player.name) ) {
                    d3.select(".searchresults")
                        .append("li")
                        .attr("class", "playeroption")
                        .text(player.name) 
                        .on("click", function (d, i) {
                            d3.selectAll(".searchfield").classed("initial", false);
                            d3.selectAll(".searchresults").classed("initialresults", false);

                            const playerName = d3.event.target.textContent;
                            clearSearch(playerName);
                            clearPlayerMenuResults();
                            clearPlayerGames();
                            
                            drawChart(playerName, season);
                            loadPlayerGames(playerName, season);

                            displayGameBreakdownButton(playerName, season);

                            displayPlayerTeam(players[player.name]);

                            displaySeasonSelector();
                        })

                    players[player.name] = player.team_name;
                }
            });
        });
}

function loadPlayerGames(player, season) {
    d3.csv(`../dataset/${season}.csv`)
        .then(function (data) {
            const games = {};
            data.forEach(shot => {
                if(shot.name.toLowerCase() === player.toLowerCase() && games[shot.game_date] === undefined) {
                    games[shot.game_date] = [];
                    games[shot.game_date].push(shot.opponent);
                    games[shot.game_date].push(shot.team_name);
                }
            });
            displayPlayerGames(games, season);
            displayAllGamesButton(player, season);
        });
}

function displayPlayerTeam(team) {
    d3.select(".team h3").remove();

    d3.select(".team").append("h3").text(`Team: ${team}`)
}

function displayAllGamesButton(playerName, season) {
    d3.select(".allshotsbutton").remove();

    const activeClass = "qactive";

    d3.select(".allbutton-div")
        .append("input")
        .property("type", "button")
        .property("value", "All Games")
        .attr("class", "allshotsbutton")
        .on("click", function (d, i) {
            drawChart(playerName, season);

            const alreadyIsActive = d3.select(this).classed(activeClass);

            d3.selectAll(".quarters input").classed(activeClass, false);

            d3.select(this).classed(activeClass, !alreadyIsActive);
        })
}

function displayPlayerGames(games, season) {
    d3.selectAll(".games li").remove();

    const allGames = games;
    const activeClass = "selectedgame";

    Object.keys(allGames).forEach( (date) => {
        const opp = allGames[date][0].split(" ");
        const oppTeamName = opp[opp.length - 1];
        
        const teamName = allGames[date][1];

        d3.select(".search").text("Search by Game")

        d3.select(".games")
            .append("li")
            .text(date)
            .append("img")
            .attr("class", "teamLogo")
            .property("src", `../assets/${oppTeamName}.png`)
            .on("click", function (d, i) {
                const playerName = d3.select(".searchfield")._groups[0][0].placeholder;
                const date = d3.event.target.parentElement.textContent;

                drawChart(playerName, season, date);
                displayQuarterButtons(playerName, season, date);
                displayPlayerTeam(teamName);

                const alreadyIsActive = d3.select(this).classed(activeClass);

                d3.selectAll(".games li").classed(activeClass, false);

                d3.select(this.parentElement).classed(activeClass, !alreadyIsActive);
            })
    })
}

function clearPlayerGames() {
    d3.selectAll(".games li").remove();
}

function displayQuarterButtons(playerName, season, date) {
    d3.selectAll(".quarters input").remove();

    // all quarter buttons
    for(let i = 1; i < 5; i++) {
        const qNum = i;
        const quarter = "Q" + qNum.toString();
        new Qbutton(playerName, season, date, quarter);
    }

    // E 
    new Qbutton(playerName, season, date);
}

function clearPies() {
    d3.selectAll("#svgcontainer svg").remove();
}

function displaySeasonSelector() {
    d3.select(".seasonselect-div select").remove();

    d3.select(".seasonselect-div").append("select");

    for(let i = 2018; i >= 2010; i--) {
        d3.select(".seasonselect-div select")
            .append("option")
            .property("value", `${i}`)
            .attr("label", `${i}`)
    }
    const activeClass = "qactive";

    d3.select(".seasonselect-div select")
        .on("change", function (d, i) {
            const playerName = d3.select(".searchfield")._groups[0][0].placeholder;
            const season = d3.event.target.value;
            drawChart(playerName, season)
            displayGameBreakdownButton(playerName, season);
            loadPlayerGames(playerName, season);

            d3.selectAll(".quarters input").classed(activeClass, false);
        })
}

function getTeamname() {
    const teamName = d3.select(".team h3")._groups[0][0].textContent.split(" ");
    return teamName.slice(1,teamName.length).join(" ");
}

function displayGameBreakdownButton(playerName, season) {
    d3.selectAll(".breakdownbutton").remove();

    d3.select(".breakdown-div")
        .append("input")
        .property("type", "button")
        .property("value", "Season Shot Breakdown")
        .attr("class", "breakdownbutton")
        .on("click", function (d, i) {
            clearChart();
            clearPies();

            const svg = d3.select("svg");

            // made shots
            const pieMade = new Pie(svg, playerName, season);
            pieMade.madeMissedStats();

            // action type
            const pieAction = new Pie(svg, playerName, season);
            pieAction.shotActionStats();

            // shots by quarter 
            const pieQuarter = new Pie(svg, playerName, season);
            pieQuarter.shotQuarterStats();

            // shots by distance
            const pieDistance = new Pie(svg, playerName, season);
            pieDistance.shotDistanceStats();

            const teamName = getTeamname();

            // indiv v.s team shots
            const indivTeam = new Pie(svg, playerName, season);
            indivTeam.indivTeamStats(teamName);

            // indiv v.s. team made shots 
            const indivMadeTeam = new Pie(svg, playerName, season);
            indivMadeTeam.madeTeamStats(teamName);
        })
}

