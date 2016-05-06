//start by declaring and initializing a bunch of variables.
var width = parseInt(d3.select("#viz").style("width").slice(0, -2)),
    height = $(window).height() - 30,
    padding = 20,
    speed = 400,
    failColor = "#e41a1c"
    successColor = "#377eb8",
    buttonColor = "#4daf4a",
    numIntervals = 100,
    numTrials = 50,
    theta = 0.5; //global theta.

var svg = d3.select("#viz").append("svg")
    .attr("width", width)
    .attr("height", height)

//scale for placing the confidence interval/ point estimate.
var CI_x = d3.scale.linear()
    .domain([0,1])
    .range([padding*3,width - padding*3]);

var CI_y = d3.scale.ordinal()
    .domain(d3.range(numIntervals))
    .rangeBands([padding*2 + 50, height - padding]);

//button for generating a new tri
var genButton = d3.select("svg").append("g")
    .attr("class", "genButton")
    .attr("transform", "translate(" + (width/2) + ",50)")

genButton.append("rect")
    .attr("x", -75)
    .attr("y", -25)
    .attr("rx", 15)
    .attr("ry", 15)
    .attr("width", 150)
    .attr("height", 40)
    .attr("fill", buttonColor )
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("opacity", 0.5)
    .on("click", function(){
        var CIs = makeCIs(numIntervals,numTrials,theta)
        drawIntervals(CIs)
        scoreReport(CIs)
    })

genButton.append("text")
    .attr("text-anchor", "middle")
    .text("Generate CIs")
    .on("click", function(){ drawIntervals(makeCIs(100,200,theta)) })
    .style("pointer-events", "none")
    .style("user-select", "none")


//Function to generate a bunch of confidence intervals
// Generate m confidence intervals using n trials with success p
// Returns json of the cis.
function makeCIs(m,n,p){
    CIs = []
    for(var i = 0; i < m; i++){
        // CIs.push(waldInterval(binomialDraw(n,p)))
        CIs.push(wilsonInterval(binomialDraw(n,p)))
    }
    return CIs;
}

var intervalViz = d3.select("svg").append("g")
    .attr("class", "intervalViz")

//Function to draw and move the true theta vertical line
function trueTheta(t){
    var thetaLine = intervalViz.selectAll(".thetaLine")
        .data([t])

    thetaLine.exit()
        .transition().duration(speed)
        .attr("x1", width/2)
        .attr("x2", width/2)
        .remove()

    thetaLine
        .transition().duration(speed)
        .attr("x1", function(d){return CI_x(d);})
        .attr("x2", function(d){return CI_x(d);})
        .attr("y2", height - padding)
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("opacity", 0.5)

    thetaLine.enter()
        .append("line")
        .attr("class", "thetaLine")
        .attr("x1", function(d){return CI_x(d);})
        .attr("x2", function(d){return CI_x(d);})
        .attr("y1", 70)
        .attr("y2", height - padding)
        .attr("stroke", "black")
        .attr("stroke-width", 2)
}

//does our confidence interval contain the true theta?
function containsTheta(d){ return (d.lb < theta && d.ub > theta)? true : false; }

function drawIntervals(CIs){
    CI_y.domain(d3.range(CIs.length)) //update the domain

    var confInt_lines = intervalViz.selectAll(".intervals")
        .data(CIs)

    confInt_lines.exit()
        .transition().duration(speed)
        .attr("x1", width/2)
        .attr("x2", width/2)
        .remove()

    confInt_lines
        .transition().duration(speed)
        .attr("x1", width/2)
        .attr("x2", width/2)
        .attr("y1", 65)
        .attr("y2", 65)
        .transition().duration(speed)
        .delay(function(d,i){return 10*i;})
        .attr("x1", function(d){ return CI_x(d.lb)})
        .attr("x2", function(d){ return CI_x(d.ub)})
        .attr("y1", function(d,i){return CI_y(i)})
        .attr("y2", function(d,i){return CI_y(i)})
        .attr("stroke", function(d,i){return containsTheta(d)?successColor:failColor;})

    confInt_lines.enter()
        .append("line")
        .attr("class", "intervals")
        .attr("x1", width/2)
        .attr("x2", width/2)
        .attr("y1", 65)
        .attr("y2", 65)
        .attr("stroke", function(d,i){return containsTheta(d)?successColor:failColor;})
        .attr("stroke-width", "2")
        .attr("opacity", 0.5)
        .on("mouseover", function(d,i){
            moreInfo(d,i)
            d3.select(this).attr("stroke-width", "4")
                .attr("opacity", 1)
        })
        .on("mouseout", function(d,i){
            removeInfo()
            d3.select(this).attr("stroke-width", "2")
                .attr("opacity", 0.5)
        })
        .transition().duration(speed)
        .delay(function(d,i){return 10*i;})
        .attr("x1", function(d){ return CI_x(d.lb)})
        .attr("x2", function(d){ return CI_x(d.ub)})
        .attr("y1", function(d,i){return CI_y(i)})
        .attr("y2", function(d,i){return CI_y(i)})
}

//function called on mouse over of the confint lines to show bounds.
function moreInfo(currentInt, location){
    //bubbles for ends of ci.
    confInt_ends = intervalViz.selectAll("circle")
        .data([currentInt.lb, currentInt.ub])

    confInt_ends.exit()
        .transition().duration(200)
        .attr("cx", width/2)
        .attr("r", 0)

    confInt_ends
        .transition().duration(speed)
        .attr("cx", function(d){ return CI_x(d)})
        .attr("cy", CI_y(location))
        .attr("r", 18)

    confInt_ends.enter()
        .append("circle")
        .attr("cy", CI_y(location))
        .attr("cx", function(d){ return CI_x(d)})
        .attr("r", 0)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .transition().duration(200)
        .attr("r", 18)

    //bubbles for ends of ci.
    confInt_nums = intervalViz.selectAll("text")
        .data([currentInt.lb, currentInt.ub])

    confInt_nums.exit()
        .transition().duration(speed)
        .attr("x", function(d){ return CI_x(d)})
        .attr("font-size", 0)

    confInt_nums
        .transition().duration(speed)
        .attr("x", function(d){ return CI_x(d)})
        .attr("y", CI_y(location) + 4)
        .text(function(d){return Math.round(d*100)/100;;})

    confInt_nums.enter()
        .append("text")
        .attr("x", function(d){ return CI_x(d)})
        .attr("y", CI_y(location) + 4)
        .attr("text-anchor", "middle")
        .attr("font-size", 1)
        .text(function(d){return Math.round(d*1000)/1000;})
        .transition().duration(200)
        .attr("x", function(d){ return CI_x(d)})
        .attr("font-size", 12)
}

function removeInfo(){
    intervalViz.selectAll("circle").remove()
    intervalViz.selectAll("text").remove()
}

//Grab and display the number of accurate confidence intervals
function scoreReport(CIs){
    var outOfBounds = 0
    CIs.forEach(function(d){containsTheta(d)? 0 : outOfBounds++ })

    //update the values in the report table
    d3.select("#numOutOfBounds").text(outOfBounds)
    d3.select("#coverage").text(Math.round((1 - outOfBounds/CIs.length) * 1000) / 1000 + "%")
    // return {"outOfBounds": outOfBounds, "coverage": 1 - outOfBounds/CIs.length};
}

function reset(){drawIntervals([])} //empty the visualization.

trueTheta(theta)

//--------------------------------------------------------------------------------------------
//Slider stuff: ------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------

var probOfSuccess = document.getElementById('probOfSuccess');

noUiSlider.create(probOfSuccess, {
	start: 0.5,
	range: { min: 0, max: 1 },
});

var tipHandles = probOfSuccess.getElementsByClassName('noUi-handle'),
	   tooltips = [];

// Add divs to the slider handles.I hate how clunky this is. Maybe submit a pr to the repo?
for ( var i = 0; i < tipHandles.length; i++ ){
	tooltips[i] = document.createElement('div');
	tipHandles[i].appendChild(tooltips[i]);
}

probOfSuccess.noUiSlider.on('update', function(values, handle, unencoded){ //what to do when the slider is moved.
        tooltips[handle].innerHTML = values[handle];
        p_of_success = +values
        theta = p_of_success //change the theta.
        trueTheta(theta)
    })

probOfSuccess.noUiSlider.on('change', function(values, handle, unencoded){ //what to do when the slider is dropped.
        p_of_success = +values
        // take the given value, reset all the trials and start new.
        reset() //reset the visualization
    })

//Number of simulations slider
var numSimSlider = document.getElementById('numOfSims');

noUiSlider.create(numSimSlider, {
    start: 100,
	range: { min: 1, max: 500 },
});

var tipHandles2 = numSimSlider.getElementsByClassName('noUi-handle'),
	   tooltips2 = [];

// Add divs to the slider handles.I hate how clunky this is. Maybe submit a pr to the repo?
for ( var i = 0; i < tipHandles2.length; i++ ){
	tooltips2[i] = document.createElement('div');
	tipHandles2[i].appendChild(tooltips2[i]);
}

numSimSlider.noUiSlider.on('update', function(values, handle, unencoded){ //what to do when the slider is moved.
        tooltips2[handle].innerHTML = Math.round(values[handle]);
})

numSimSlider.noUiSlider.on('change', function(values, handle, unencoded){ //what to do when the slider is dropped.
        numIntervals = Math.round(+values) //change the number of intervals to draw.
})
