//////////////////// Set up and initiate svg containers ///////////////////

var margin = {
	top: 30,
	right: 0,
	bottom: 30,
	left: 0
};

var height = window.innerHeight - margin.top - margin.bottom - 20;
var width = window.innerWidth - margin.left - margin.right - 20;

//SVG container
var svg = d3.select("#diabetesRadial")
	.append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + (margin.left + width/2) + "," + (margin.top + height/2) + ")");

//////////////////////////// Create scales ////////////////////////////////

//Parses a string into a date
var parseDate = d3.time.format("%Y-%m-%d").parse;

//Turn strings into actual numbers/dates
DiabetesData.forEach(function(d) {d.dt2 = parseDate(d.dt2);});

//Set the minimum inner radius and max outer radius of the chart
var	outerRadius = Math.min(width, height, 500)/2,
	innerRadius = outerRadius * 0.3;

//Base the color scale on average glucose extremes
var colorScale = d3.scale.linear()
	.domain([0, 40, 60, 160, 200, 240, 500])
	.range(["#d7191c", "#d7191c","#FFFF66", "#32CD32", "#FFFF66","#d7191c","#d7191c"])
	.interpolate(d3.interpolateHcl);

//Scale for the heights of the bar, not starting at zero to give the bars an initial offset outward
var barScale = d3.scale.linear()
	.range([innerRadius, outerRadius])
	.domain([0,500]);

//Scale to turn the date into an angle of 360 degrees in total
//With the first datapoint (Jan 1st) on top
var angle = d3.scale.linear()
	.range([-180, 180])
	.domain(d3.extent(DiabetesData, function(d) { return d.dt2; }));

//////////////////////////// Create Titles ////////////////////////////////

var textWrapper = svg.append("g").attr("class", "textWrapper")
	.attr("transform", "translate(" + Math.max(-width/2, -outerRadius - 170) + "," + 0 + ")");

//Append title to the top
textWrapper.append("text")
	.attr("class", "title")
    .attr("x", width/4-55)
    .attr("y", -outerRadius - 50)
    .text("Yearly Glucose Circle");
textWrapper.append("text")
	.attr("class", "subtitle")
    .attr("x", width/4-55)
    .attr("y", -outerRadius - 30)
    .text("2017");

///////////////////////////// Create Axes /////////////////////////////////

//Wrapper for the bars and to position it downward
var barWrapper = svg.append("g")
	.attr("transform", "translate(" + 0 + "," + 0 + ")");

//Draw gridlines below the bars
var axes = barWrapper.selectAll(".gridCircles")
 	.data([0,50,100,200,300,500])
 	.enter().append("g");
//Draw the circles
axes.append("circle")
 	.attr("class", "axisCircles")
 	.attr("r", function(d) { return barScale(d); });
//Draw the axis labels
axes.append("text")
	.attr("class", "axisText")
	.attr("y", function(d) { return barScale(d); })
	.attr("dy", "0.3em")
	.text(function(d) { return d + ""});

//Add January for reference
barWrapper.append("text")
	.attr("class", "january")
	.attr("x", 7)
	.attr("y", -outerRadius * 1.1)
	.attr("dy", "0.9em")
	.text("January");

//Add a line to split the year
barWrapper.append("line")
	.attr("class", "yearLine")
	.attr("x1", 0)
	.attr("y1", -innerRadius * 0.65)
	.attr("x2", 0)
	.attr("y2", -outerRadius * 1.1);

////////////////////////////// Draw bars //////////////////////////////////

//Draw a bar per day were the height is the difference between the minimum and maximum glucose
//And the color is based on the mean glucose
barWrapper.selectAll(".glucoseBar")
 	.data(DiabetesData)
 	.enter().append("rect")
 	.attr("class", "glucoseBar")
 	.attr("transform", function(d,i) { return "rotate(" + (angle(d.dt2)) + ")"; })
  	.transition()
 	.delay(function(d,i){ return 15*i; })
 	.duration(1000)
 	.attr("width", 1.5)
	.attr("height", function(d,i) { return barScale(d.Max) - barScale(d.Min); })
 	.attr("x", -0.75)
 	.attr("y", function(d,i) {return barScale(d.Min); })
 	.style("fill", function(d) { return colorScale(d.Mean); });

//////////////// Create the gradient for the legend ///////////////////////

//Extra scale since the color scale is interpolated
var glucoseScale = d3.scale.linear()
	.domain([0, 300])
	.range([0, width]);

//Calculate the variables for the glucose gradient
var numStops = 10;
glucoseRange = glucoseScale.domain();
glucoseRange[2] = glucoseRange[1] - glucoseRange[0];
glucosePoint = [];
for(var i = 0; i < numStops; i++) {
	glucosePoint.push(i * glucoseRange[2]/(numStops-1) + glucoseRange[0]);
}//for i

//Create the gradient
svg.append("defs")
	.append("linearGradient")
	.attr("id", "legend-glucose")
	.attr("x1", "0%").attr("y1", "0%")
	.attr("x2", "100%").attr("y2", "0%")
	.selectAll("stop")
	.data(d3.range(numStops))
	.enter().append("stop")
	.attr("offset", function(d,i) { return glucoseScale( glucosePoint[i] )/width; })
	.attr("stop-color", function(d,i) { return colorScale( glucosePoint[i] ); });

////////////////////////// Draw the legend ////////////////////////////////

var legendWidth = Math.min(outerRadius*2, 350);

//Color Legend container
var legendsvg = svg.append("g")
	.attr("class", "legendWrapper")
	.attr("transform", "translate(" + 0 + "," + (outerRadius + 60) + ")");

//Draw the Rectangle
legendsvg.append("rect")
	.attr("class", "legendRect")
	.attr("x", -legendWidth/2)
	.attr("y", 0)
	.attr("rx", 8/2)
	.attr("width", legendWidth)
	.attr("height", 8)
	.style("fill", "url(#legend-glucose)");

//Append title
legendsvg.append("text")
	.attr("class", "legendTitle")
	.attr("x", 0)
	.attr("y", -10)
	.style("text-anchor", "middle")
	.text("Average Daily Glucose Concentration");

//Set scale for x-axis
var xScale = d3.scale.linear()
	 .range([-legendWidth/2, legendWidth/2])
	 .domain([0,300] );

//Define x-axis
var xAxis = d3.svg.axis()
	  .orient("bottom")
	  .ticks(4)
	  .tickFormat(function(d) { return d + "mg/dL"; })
	  .scale(xScale);

//Set up X axis
legendsvg.append("g")
	.attr("class", "axis")
	.attr("transform", "translate(0," + (10) + ")")
	.call(xAxis);
