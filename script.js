//just some nonsense to move objects to front easily.
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

var width = parseInt(d3.select("#viz").style("width").slice(0, -2)),
    height = $(window).height() - 85,
    padding = 35,
    speed = 500,
    colors = ['#66c2a5','#fc8d62','#8da0cb','#e78ac3'];

var svg = d3.select("#viz").append("svg")
    .attr("height", height)
    .attr("width", width)

// var currentIntervals = [{"value":1/8, "name": "1/8"},
//                         {"value":1/16, "name": "1/16"}

var currentIntervals = ["1/8", "1/16"]

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
         .attr("transform", "translate("+ (width/2 + 5) + " ,19)")
         .attr("dy", ".9em")
         .style("text-anchor", "end")
         .style("font-size", 15)
         .text("Binomial p");

svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + padding + ",0)")
    .call(yAxis)
    .append("text")
        .attr("transform", "translate(" + padding*1.7 + ",7)")
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
      .transition().duration(speed)
      .attr("d", line);


//calculate the likelihood interval.
//Takes as input the string of the fraction for interval and the vector of likelihoods
function lik_int(name, lik_vec){
    var val = eval(name); //turn the fraction string into a value.

    //traverse up the likelihoods to find left instance of value
    var left_pos = 0
    while (lik_vec[left_pos].likelihood < val) {left_pos++;}

    //traverse down likelihoods to find right instance
    var right_pos = lik_vec.length - 1
    while (lik_vec[right_pos].likelihood < val) { right_pos--;}

    var left  = Math.max(lik_vec[left_pos].p, 0) //dont let the intervals go out of bounds.
    var right = Math.min(lik_vec[right_pos].p, 1)

    return {"name": name, "lik": val, "left":left, "right":right}
}

//Add likelihood intervals to vector.
function generateIntervals(currentIntervals, curveData){
    var ints = []
    currentIntervals.forEach(function(name){ ints.push(lik_int(name,  curveData) )})
    return ints
}

//generate initial intervals for plotting
var intervals = generateIntervals(currentIntervals, curveData)

//Function to add, remove, or move intervals.
function draw_intervals(intervals_data){

    var support_ints = svg.selectAll(".supportIntervals")
        .data(intervals_data, function(d){return d.lik})

    support_ints
        .each(function(d){
            d3.select(this).select(".intervalLine") //start with the lines.
                .transition().duration(speed)
                .attr("x1", x_scale(d.left) )
                .attr("x2", x_scale(d.right))

            d3.select(this).select(".leftDropLine")
                .transition().duration(speed)
                .attr("x1", x_scale(d.left) )
                .attr("x2", x_scale(d.left) )

            d3.select(this).select(".rightDropLine")
                .transition().duration(speed)
                .attr("x1", x_scale(d.right) )
                .attr("x2", x_scale(d.right) )

            d3.select(this).select(".leftText")
                .transition().duration(speed)
                .text( Math.round(d.left*1000)/1000 )
                .attr("x", x_scale(d.left) - 2)

            d3.select(this).select(".rightText")
                .transition().duration(speed)
                .text( Math.round(d.right*1000)/1000 )
                .attr("x", x_scale(d.right) + 2)

            d3.select(this).select(".intervalName") //draw the value of the interval above it.
                .transition().duration(speed)
                .attr("x",  x_scale((d.right + d.left)/2) )
        })

    support_ints.exit()
        .transition().duration(speed)
        .attr("transform", "scale(0.1, 0.1)") //shrink the intervals away.
        .remove()

    support_ints.enter()
        .append("g")
        .attr("class", "supportIntervals")
        .attr("transform", function(d){ //move the g up to the right position
            return "translate( 0 ," + y_scale(d.lik) +")";
        })
        .each(function(d,i){
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
                .attr("stroke", colors[i])
                .attr("stroke-width", 1.5)

            d3.select(this) //Left dropdown line
                .append("line")
                .attr("class", "leftDropLine")
                .attr("x1", x_scale(d.left) )
                .attr("x2", x_scale(d.left) )
                .attr("y1", 0 )
                .attr("y2", 0 )
                .transition().delay(speed).duration(speed/2)
                .attr("y1", 0 )
                .attr("y2", height - padding - y_scale(d.lik) )
                .attr("stroke", colors[i])
                .attr("opacity", 0.5)
                .attr("stroke-width", 1)

            d3.select(this) //right dropdown line
                .append("line")
                .attr("class", "rightDropLine")
                .attr("x1", x_scale(d.right) )
                .attr("x2", x_scale(d.right) )
                .attr("y1", 0 )
                .attr("y2", 0 )
                .transition().delay(speed).duration(speed/2)
                .attr("y1", 0 )
                .attr("y2", height - padding - y_scale(d.lik) )
                .attr("stroke", colors[i])
                .attr("opacity", 0.5)
                .attr("stroke-width", 1)

            d3.select(this) //Now the text
                .append("text")
                .attr("class", "leftText")
                .text( Math.round(d.left*1000)/1000 )
                .attr("text-anchor", "end")
                .attr("font-size", 14)
                .attr("font-family", "Optima")
                .attr("x",  x_scale((d.right + d.left)/2) )
                .attr("y", -2 )
                .transition().duration(speed)
                .attr("x", x_scale(d.left) -2)

            d3.select(this)
                .append("text")
                .attr("class", "rightText")
                .text( Math.round(d.right*1000)/1000 )
                .attr("text-anchor", "start")
                .attr("font-size", 14)
                .attr("font-family", "Optima")
                .attr("x",  x_scale((d.right + d.left)/2) )
                .attr("y", -2 )
                .transition().duration(speed)
                .attr("x", x_scale(d.right) + 2)

            d3.select(this) //draw the value of the interval above it.
                .append("text")
                .attr("class", "intervalName")
                .text( d.name )
                .attr("text-anchor", "start")
                .attr("font-size", 0)
                .attr("font-family", "Optima")
                .attr("font-weight", "bold")
                .style("fill", colors[i])
                .attr("x",  x_scale((d.right + d.left)/2) )
                .attr("y", -2 )
                .transition().duration(speed)
                .attr("font-size", 14)
        })

}

draw_intervals(intervals)
// `intervalLegend(intervalNames)

//Allow the user to input a custom n and x value and then update the trials bar.
function customNK(){
    //grab values from the user form
    var n = +document.getElementById("customN").value;
    var k = +document.getElementById("customX").value;

    //if the user accidentally put more successes than trials fix it.
    if(k > n){document.getElementById("customX").value = n}

    updateCurve(n,k) //update the likelihood and the intervals.
}

//function to update the whole plot with new data
// Function to update the likelihood curve with new data.
function updateCurve(n,k){
    curveData = likCurve(0, 1, n, k)
    svg.select(".likelihoodCurve")
        .datum(curveData)
        .transition().duration(speed)
        .attr("d", line);

    newIntervals()
    likelihoodRatio(curve)
}

function newIntervals(){
    var selected = []
    $("input:checkbox[name=intervals]:checked").each(function(){
        var value = $(this).val()
        selected.push(value);
    });

    //grab user input from the custom interval box
    var customVal = 1/eval(document.getElementById("customInt").value)
    //check if they put anything in and if they did push it to inverval array.

    if(customVal != null && !isNaN(customVal)){
        selected.push("1/" + document.getElementById("customInt").value);
    }
    draw_intervals(generateIntervals(selected, curveData))
    // intervalLegend(selectedNames)
}

//function to read in the hypothesis values for the LR and plot them + return results
function likelihoodRatio(where){

    try {
        var h1 = eval(document.getElementById("h1").value); //eval supports fractions too.
        var h2 = eval(document.getElementById("h2").value);
    } catch (e) {
        var h1 = 2
        var h2 = 4
    }

    var n  = eval(document.getElementById("customN").value); //grab the data vals too.
    var k  = eval(document.getElementById("customX").value);
    var mle = binLik(k/n, n , k)
    console.log(h2)

    if(h1 < 0 || h1 > 1 || h2 < 0 || h2 > 1 || isNaN(h1) || isNaN(h2)){
        if(where != "curve"){alert("Make sure your hypothesis are in the range of possible p")}
        //reset the values.
    } else{ //if the input is valid then let's generate some likelihood ratios.
        //generate data for plotting
        var lik_h1 = binLik(h1, n, k)/mle,
            lik_h2 = binLik(h2, n, k)/mle;

        hyp_points = [{"hypothesis": 1, "p": h1, "lik": lik_h1},
                      {"hypothesis": 2, "p": h2, "lik": lik_h2}]

        //draw circles over the likelihood curve at the hypothesis values
        var hypotheses = svg.selectAll(".hypotheses")
            .data(hyp_points, function(d){return d.hypothesis})

        hypotheses
            .transition().duration(speed)
            .attr("transform", function(d){ //move the g up to the right position
                return "translate(" + x_scale(d.p) + "," + y_scale(d.lik) +")";
            })
            .each(function(d){
                //Draw light lines to the y axis to show where the values fall
                d3.select(this) //line to y axis
                    .select("line")
                    .attr("class", "axisLine")
                    .attr("x1", -6 )
                    .attr("x2", -6 )
                    .transition().delay(speed).duration(speed)
                    .attr("x2", -x_scale(d.p) + padding )
                    .attr("stroke", "grey")
                    .attr("opacity", 0.3)
                    .attr("stroke-width", 1)
             })

        hypotheses.exit()
            .each(function(d){
                d3.select(this)
                    .select("circle")
                    .transition().duration(speed)
                    .attr("r", 0)

                d3.select(this) //line to y axis
                    .select("line")
                    .transition().duration(speed)
                    .attr("x1", -6 )
                    .attr("x2", -6 )
             })
             .remove()


        hypotheses.enter()
            .append("g")
            .attr("class", "hypotheses")
            .attr("transform", function(d){ //move the g up to the right position
                return "translate(" + x_scale(d.p) + "," + y_scale(d.lik) +")";
            })
            .each(function(d){
                d3.select(this)
                    .append("circle")
                    .attr("r", 0)
                    .attr("fill", "white")
                    .attr("stroke", d.hypothesis == 1 ? "blue":"green")
                    .attr("stroke-width", 2)
                    .transition().duration(speed)
                    .attr("r", 8)

                //Draw light lines to the y axis to show where the values fall
                d3.select(this) //line to y axis
                    .append("line")
                    .attr("class", "axisLine")
                    .attr("x1", -6 )
                    .attr("x2", -6 )
                    .transition().delay(speed).duration(speed)
                    .attr("x2", -x_scale(d.p) + padding )
                    .attr("stroke", "grey")
                    .attr("opacity", 0.3)
                    .attr("stroke-width", 1)
             })

        //calculate the likelihood ratio and display somewhere.
        var LR = Math.round((lik_h1/lik_h2) * 1000) /1000
        d3.select("#ratioReport")
            .style("font-weight", "bold")
            .text(LR)
    }
}

function clear_LR(){
    //empty the text boxes and then call the ratio function which will remove points.
    document.getElementById("h1").value = "";
    document.getElementById("h2").value = "";
    d3.select("#ratioReport").text("")
    d3.selectAll(".hypotheses").remove()
}

function clear_custom_int(){
    document.getElementById("customInt").value = "";
    newIntervals()
}
