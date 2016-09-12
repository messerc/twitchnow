var totalviewers;

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};


function loadTable() {
$.getJSON('https://api.twitch.tv/kraken/games/top?limit=25', function(data){
	var newarray = data.top
	var html = "";
	//grabbing each game name and throwing it into list
	//grabbing all viewers and throwing it into list 
	newarray.forEach(function(d) {
		html += '<tr class="hover small"><td>'+d.game.name+'</td>'+ 
				'<td><span class="small">'+numberWithCommas(d.viewers)+'</span></td>' +
				'<td><span class="small white">('+Math.round((d.viewers/totalviewers)*100)+'%)</td></tr>'
	});
	$(".table").html(html);
});
};

$("body").on("click", ".hover", function() {
	var gamename = $(this).find('td:first-of-type').html();
	$.getJSON("https://api.twitch.tv/kraken/streams?limit=20&game="+gamename, function(data) {
	var html = "";
	var newarray = data.streams
	newarray.forEach(function(d) {
		html += '<tr class="hover small"><td>'+d.channel.name+'</td>'+
				'<td><span class="small">'+numberWithCommas(d.viewers)+'</td></tr>'
	});
	$(".insert").html(html);
});
});




function loadTopline() {
$.getJSON('https://api.twitch.tv/kraken/streams/summary', function(data) {
	totalviewers = data.viewers;
	totalchannels = data.channels;
	$(".viewers").html('<strong>'+numberWithCommas(totalviewers)+'</strong> <span class="small">watching</span>');
	$(".channels").html('<strong>'+numberWithCommas(totalchannels)+'</strong> <span class="small">streaming</span>');
});
};

loadTopline();
loadTable();

setInterval(loadTable, 10000);
setInterval(loadTopline, 10000);

var formatNumber = d3.format(",d");

var svg = d3.select("svg");

var width = +svg.attr("width"),
    height = +svg.attr("height");

var groupSpacing = 5,
    cellSpacing = 1,
    cellSize = Math.floor((width - 11 * groupSpacing) / 100) - cellSpacing,
    offset = Math.floor((width - 100 * cellSize - 90 * cellSpacing - 11 * groupSpacing) / 2);

var updateDuration = 500,
    updateDelay = updateDuration / 500;

var cell = svg.append("g")
    .attr("class", "cells")
    .attr("transform", "translate(" + offset + "," + (offset + 30) + ")")
  .selectAll("rect");

var label = svg.append("text")
    .attr("class", "label");

function update(n1) {
  var n0 = cell.size();

  cell = cell
      .data(d3.range(n1));

  cell.exit().transition()
      .delay(function(d, i) { return (n0 - i) * updateDelay; })
      .duration(updateDuration)
      .attr("width", 0)
      .remove();

  cell.enter().append("rect")
      .attr("width", 0)
      .attr("height", cellSize)
      .attr("x", function(i) {
        var x0 = Math.floor(i / 100) % 10, x1 = Math.floor(i % 10);
        return groupSpacing * x0 + (cellSpacing + cellSize) * (x1 + x0 * 10);
      })
      .attr("y", function(i) {
        var y0 = Math.floor(i / 1000), y1 = Math.floor(i % 100 / 10);
        return groupSpacing * y0 + (cellSpacing + cellSize) * (y1 + y0 * 10);
      })
    .transition()
      .delay(function(d, i) { return (i - n0) * updateDelay; })
      .duration(updateDuration)
      .attr("width", cellSize);

  label
      .attr("x", offset + groupSpacing)
      .attr("y", offset + groupSpacing)
      .attr("dy", ".71em")
    .transition()
      .duration(Math.abs(n1 - n0) * updateDelay + updateDuration / 2)
      .ease("linear")
      .tween("text", function() {
        var i = d3.interpolateNumber(n0, n1);
        return function(t) {
          this.textContent = formatNumber(Math.round(i(t)));
        };
      });
}

(function interval() {
	$.getJSON('https://api.twitch.tv/kraken/streams/summary', function(data) {
	totalviewers = data.viewers;
	update(totalviewers / 1000);
});
})();

d3.select(self.frameElement).style("height", height + "px");
