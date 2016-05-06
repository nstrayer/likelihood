//just some nonsense to move objects to front easily.
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

var width = parseInt(d3.select("#viz").style("width").slice(0, -2)),
    height = $(window).height() - 85,
    padding = 30;

var svg = d3.select("#viz").append("svg")
    .attr("height", height)
    .attr("width", width)

var currentIntervals = [1/8, 1/16]
//Binomial likelihood function.
function binLik(p, n , k){ return Math.pow(p,k) * Math.pow((1-p), (n - k)) }

// Function that takes a range of p (0, 1) and calcuates the maximum val (MLE)
// then divides the rest of the results by that value to get a normalized likelihood
// Values, start = begining index, end = ending index, n = num trials, k = successes
function likCurve(start, end, n, k){
    var largest = 0 //initiate variable to hold largest value

    //generate a vector 1000 elements long
    var p = d3.range(start,end,(end-start)/2000)

    var mle = binLik(k/n, n , k)

    //array to hold the results of likelihood
    var curve = []

    //in a loop calculate all value based on likelihood
    //At each timestep check to see if it's the largest and store if it is
    p.forEach(function(val){
        //Calclate the current likelihood value un-normalized
        likelihoodVal = binLik(val, n , k)
        //push to curve vector with normalized value.
        curve.push({"likelihood":likelihoodVal/mle, "p":val})
    })

    //return json of normalized vector combined with the p values.
    return curve
}

//------------------------------------------------------------------------------
// Stuff for plotting likelihood curve
//------------------------------------------------------------------------------

var x_scale = d3.scale.linear()
    .domain([0,1])
    .range([padding, width-padding]);

var y_scale = d3.scale.linear()
    .domain([0,1])
    .range([height-padding, padding]);

var xAxis = d3.svg.axis()
    .scale(x_scale)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y_scale)
    .orient("left");

//draw the axes
svg.append("g")
     .attr("class", "x axis")
     .attr("transform", "translate(0," + (height - padding) + ")")
     .call(xAxis)
     .append("text")
         .attr("transform", "translate("+ width/2.1 + " 12)")
         .attr("dy", ".9em")
         .style("text-anchor", "end")
         .style("font-size", 15)
         .text("Binomial p");

svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + padding + ",0)")
    .call(yAxis)
    .append("text")
        .attr("transform", "translate(" + padding*1.5 + ",0)")
        .attr("y", 6)
        .attr("dy", ".9em")
        .style("text-anchor", "end")
        .style("font-size", 15)
        .text("Likelihood");

var lineStart = d3.svg.line()
    .x(function(d){return x_scale(d.p)})
    .y(function(d){return y_scale(0)});

var line = d3.svg.line()
    .x(function(d){return x_scale(d.p)})
    .y(function(d){return y_scale(d.likelihood)});

var curveData = likCurve(0, 1, 10, 8)

svg.append("path")
      .datum(curveData)
      .attr("class", "line likelihoodCurve")
      .attr("d", lineStart)
      .transition().duration(700)
      .attr("d", line);


//calculate the likelihood interval.
function lik_int(val, lik_vec){

    //traverse up the likelihoods to find left instance of value
    var left_pos = 0
    while (lik_vec[left_pos].likelihood < val) {left_pos++;}

    //traverse down likelihoods to find right instance
    var right_pos = lik_vec.length - 1
    while (lik_vec[right_pos].likelihood < val) { right_pos--;}

    return {"lik": val, "left":lik_vec[left_pos].p, "right":lik_vec[right_pos].p}
}

//Add likelihood intervals to vector.
function generateIntervals(currentIntervals, curveData){
    var ints = []
    currentIntervals.forEach(function(int){ ints.push(lik_int(int,  curveData) )})
    return ints
}

//generate initial intervals for plotting
var intervals = generateIntervals(currentIntervals, curveData)


//Function to add, remove, or move intervals.
function draw_intervals(intervals_data){
    var speed = 800;

    var support_ints = svg.selectAll(".supportIntervals")
        .data(intervals_data)

    support_ints
        .each(function(d){
            d3.select(this).select(".intervalLine") //start with the lines.
                .transition().duration(speed)
                .attr("x1", x_scale(d.left) )
                .attr("x2", x_scale(d.right))

            d3.select(this).select(".leftText")
                .transition().duration(speed)
                .text( Math.round(d.left*1000)/1000 )
                .attr("x", x_scale(d.left) - 42 )

            d3.select(this).select(".rightText")
                .transition().duration(speed)
                .text( Math.round(d.right*1000)/1000 )
                .attr("x", x_scale(d.right) )
        })

    support_ints.enter()
        .append("g")
        .attr("class", "supportIntervals")
        .attr("transform", function(d){ //move the g up to the right position
            return "translate( 0 ," + y_scale(d.lik) +")";
        })
        .each(function(d){
            d3.select(this) //start with the lines.
                .append("line")
                .attr("class", "intervalLine")
                .attr("x1", x_scale((d.right + d.left)/2) )
                .attr("x2", x_scale((d.right + d.left)/2) )
                .attr("y1", 0 ) //we already took care of the vertical positioning
                .attr("y2", 0 )
                .transition().duration(speed)
                .attr("x1", x_scale(d.left) )
                .attr("x2", x_scale(d.right))
                .attr("stroke", "red")
                .attr("stroke-width", 1)

            d3.select(this) //Left dropdown line
                .append("line")
                .attr("class", "leftDropLine")
                .attr("x1", x_scale(d.left) )
                .attr("x2", x_scale(d.left) )
                .attr("y1", 0 )
                .attr("y2", 0 )
                .transition().delay(speed).duration(speed)
                .attr("y1", 0 )
                .attr("y2", height - padding - y_scale(d.lik) )
                .attr("stroke", "grey")
                .attr("opacity", 0.3)
                .attr("stroke-width", 1)

            d3.select(this) //Left dropdown line
                .append("line")
                .attr("class", "rightDropLine")
                .attr("x1", x_scale(d.right) )
                .attr("x2", x_scale(d.right) )
                .attr("y1", 0 )
                .attr("y2", 0 )
                .transition().delay(speed).duration(speed)
                .attr("y1", 0 )
                .attr("y2", height - padding - y_scale(d.lik) )
                .attr("stroke", "grey")
                .attr("opacity", 0.3)
                .attr("stroke-width", 1)

            d3.select(this) //Now the text
                .append("text")
                .attr("class", "leftText")
                .text( Math.round(d.left*1000)/1000 )
                .attr("text-anchor", "right")
                .attr("font-size", 12)
                .attr("font-family", "Optima")
                .attr("font-size", 18)
                .attr("x",  x_scale((d.right + d.left)/2) )
                .attr("y", -2 )
                .transition().duration(speed)
                .attr("x", x_scale(d.left) - 42 )

            d3.select(this)
                .append("text")
                .attr("class", "rightText")
                .text( Math.round(d.right*1000)/1000 )
                .attr("text-anchor", "left")
                .attr("font-size", 12)
                .attr("font-family", "Optima")
                .attr("font-size", 18)
                .attr("x",  x_scale((d.right + d.left)/2) )
                .attr("y", -2 )
                .transition().duration(speed)
                .attr("x", x_scale(d.right) )
        })

    support_ints.exit()
        .transition().duration(speed)
        .attr("transform", "scale(0.1)") //shrink the intervals away.
        .remove()

}

draw_intervals(intervals)

//function to update the whole plot with new data
// Function to update the likelihood curve with new data.
function updateCurve(n,k){
    var curveData = likCurve(0, 1, n, k)
    svg.select(".likelihoodCurve")
        .datum(curveData)
        .transition().duration(700)
        .attr("d", line);

    //update the intervals
    intervals = generateIntervals(currentIntervals, curveData)
    draw_intervals(intervals)
}
