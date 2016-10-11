// client ID = j04u3arfwaaxamhkczfl48egoeh3ncn


//Lets make a few arrays that our chart can later reference....we want %s folks

var gamearray = [];

loadTopline();

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

function loadTopline() {
	//Load initial topline data
	var totalviewers;
	$.ajax({
		type: 'GET',
		url: 'https://api.twitch.tv/kraken/streams/summary',
		headers: {
			'Client-ID': 'j04u3arfwaaxamhkczfl48egoeh3ncn'
		},
		success: function(data) {
			totalviewers = data.viewers;
			totalchannels = data.channels;
			$(".viewer").html('<strong>'+numberWithCommas(totalviewers)+'</strong> <span class="small">watching</span>');
			$(".channels").html('<strong>'+numberWithCommas(totalchannels)+'</strong> <span class="small">streaming</span>');

			//On success - load the table below 
			$.ajax({
					type: 'GET',
					url: 'https://api.twitch.tv/kraken/games/top?limit=25',
					headers: {
								'Client-ID': 'j04u3arfwaaxamhkczfl48egoeh3ncn'
							},
					success: function(data) {
					var newarray = data.top;
					gamearray.push(newarray);
					var html = '<tr class="small">'+
								'<td>game</td>'+
								'<td>viewers</td>'+
								'<td>% of twitch</td></tr>';
					newarray.forEach(function(d) {
							html += '<tr class="hover small"><td>'+d.game.name+'</td>'+ 
							'<td><span class="small">'+numberWithCommas(d.viewers)+'</span></td>' +
							'<td><span class="small white">'+Math.round((d.viewers/totalviewers)*100)+'%</td></tr>';
					});
					$(".table").html(html);
					}
				});
			}
		});
	};


//On click - load the game to the right 
$("body").on("click", ".hover", function() {
	var gamename = $(this).find('td:first-of-type').html();
	//Gathering the game name + box art 
	$.ajax({
		type: 'GET',
		url: 'https://api.twitch.tv/kraken/search/games?q='+gamename+'&type=suggest',
		headers: {
			'Client-ID': 'j04u3arfwaaxamhkczfl48egoeh3ncn'
		},
		success: function(data) {
			var html = "";
			var html2 = "";
			// Need to loop through gamearray until I match on gamename -- then filter in total viewers + total streamers
			for (var i=0; i < gamearray[0].length; i++) {
				if (gamearray[0][i].game.name === gamename)
					html2 = '<p class="gametitle">'+gamename+'</p>'
							+'<h4><strong>'+numberWithCommas(gamearray[0][i].viewers)+'</strong><span class="small"> watching |  rank '+(i+1)+'</span></h4>'
							+'<h4><strong>'+numberWithCommas(gamearray[0][i].channels)+'</strong><span class="small"> streaming</span></h4>';
			}
			var pic = data.games[0].box.medium;
			html = '<img class="img-circle" src="'+pic+'">';
			$(".header").html(html);
			$(".gamename").html(html2);
		}
	});
	//Gathering the actual data and drawing / re-drawing the d3 bar chart
	$.ajax({
		type: 'GET',
		url: 'https://api.twitch.tv/kraken/streams?limit=20&game='+gamename,
		headers: {
			'Client-ID': 'j04u3arfwaaxamhkczfl48egoeh3ncn'
		},
		success: function(data) {
			
		var dataset = [];
		data.streams.forEach(function(d) {
				dataset.push(d);
			});
		//Update the scales 
		var xScale = d3.scale.linear()
			   .domain([0, (d3.max(dataset, d => d.viewers))])
			   .range([0, w - (padding + 100)]);

		var yScale = d3.scale.ordinal()
			   .domain(d3.range(dataset.length))
			   .rangeRoundBands([0, (h + paddinglight)], 0.1);

		//Update the axis 

		var xAxis = d3.svg.axis()
					  .scale(xScale)
					  .orient("top")
					  .ticks(5)



		//Channel name var to join
		var channel = d => d.channel.name;

		//Remove Old Bars and Text

		svg.selectAll("rect")
			.data(dataset, channel)
			.exit()
			.transition()
			.duration(100)
			.ease("linear")
			.remove()

		svg.selectAll("text")
			.data(dataset, channel)
			.exit()
			.remove()


		//Create the bars and text
		svg.selectAll("rect")
			.data(dataset, channel)
			.enter()
			.append("rect")
			.attr("x", (d) => padding - 5)
			.attr("y", (d, i) => yScale(i) + paddinglight)
			.attr("width", d => xScale(0))
			.attr("height", d => yScale.rangeBand() - 2)
			.attr("class", "bar")
			.on("mouseover", function(d) {
				var yPosition = parseFloat(d3.select(this).attr("y")) + yScale.rangeBand() + (yScale.rangeBand() / 2)
				var xPosition = parseFloat(d3.select(this).attr("x")) + 250


				d3.select("#tooltip")
				   .style("left", "450px")
				   .style("top", "45px")
				   .select("#value")
				   .html(d.channel.name)


				d3.select("#tooltip")
				   .style("left", "450px")
				   .style("top", "40px")
				   .select("#channeltitle")
				   .text(d.channel.status)

				d3.select("#tooltip")
				  .classed("hidden", false)
			})
			.on("mouseout", function(d) {
				d3.select("#tooltip").classed("hidden", true)
			})

 		//Creating text for names
	    svg.selectAll("text.name")
	    	.data(dataset, channel)
	    	.enter()
	    	.append("text")
			.attr("x", (d) => 105)
			.attr("y", (d, i) => (yScale(i) + paddinglight) + (yScale.rangeBand() / 2) + 3)
			.text(d => d.channel.name)
			.attr("class", "name")
			.attr("fill", "rgb(51, 51, 51)")

		//Creating text for viewer numbers 
		svg.selectAll("text.viewers")
		   .data(dataset, channel)
		   .enter()
		   .append("text")
		   .attr("x", d => xScale(d.viewers) + padding - 2)
		   .attr("y", (d, i) => (yScale(i) + paddinglight) + (yScale.rangeBand() / 2) + 3)
		   .text(d => d.viewers)
		   .attr("class", "viewers")
		   .attr("fill", "rgb(51, 51, 51)") 

		//Enter transition for the bars and text
		svg.selectAll("rect")
			.data(dataset, channel)
			.transition()
			.duration(250)
			.delay((d, i) => i * 50)
			.ease("linear")
			.attr("x", (d) => padding)
			.attr("y", (d, i) => yScale(i) + paddinglight)
			.attr("width", d => xScale(d.viewers))
			.attr("height", d => yScale.rangeBand() - 2)
			.attr("class", "bar")

		svg.selectAll("text.name")
			.data(dataset, channel)
			.transition()
			.duration(500)
			.delay((d, i) => i * 50)
			.ease("linear")
			.attr("x", (d) => 110)
			.attr("y", (d, i) => (yScale(i) + paddinglight) + (yScale.rangeBand() / 2) + 3)
			.text(d => d.channel.name)
			.attr("fill", "white")
			.attr("text-anchor", "end")

		svg.selectAll("text.viewers")
		   .data(dataset, channel)
		   .transition()
		   .duration(500)
		   .delay((d, i) => i * 50)
		   .ease("linear")
		   .attr("x", d => xScale(d.viewers) + padding + 5)
		   .attr("y", (d, i) => (yScale(i) + paddinglight) + (yScale.rangeBand() / 2) + 3)
		   .text(d => d.viewers)
		   .attr("fill", "rgb(104, 104, 104)")

		}
	});
});


//D3 Chart Components 

var w = 600;
var h = 545;
var padding = 120;
var paddinglight = 0;


//Create SVG element

var svg = d3.select(".chart")
			.append("svg")
			.attr("width", w)
			.attr("height", h);

//Bar highlights viewer number




