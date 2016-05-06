//start by declaring and initializing a bunch of variables.
var width = parseInt(d3.select("#viz").style("width").slice(0, -2)),
    height = $(window).height() - 30,
    padding = 20,
    speed = 400,
    theta = 0.5,
    altHypothesisVal = 0.5,
    currentPVal,
    trials = [],
    idCounter = 1, //counter for giving the trials unique values. Need ids for object consistancy
    failColor = "#e41a1c"
    successColor = "#377eb8",
    buttonColor = "#4daf4a";

var svg = d3.select("#viz").append("svg")
    .attr("width", width)
    .attr("height", height)

//scale for the trials bar.
var barX = d3.scale.ordinal()
    .domain(d3.range(trials.length))
    .rangeBands([padding*3,width - padding*3]);

//scale for placing the confidence interval/ point estimate.
var CIScale = d3.scale.linear()
    .domain([0,1])
    .range([padding*3,width - padding*3]);

//make a g for holding the progressbar and confidence interval.
var trialViz = d3.select("svg").append("g")
    .attr("class", "trialViz")
    .attr("transform", "translate(0,400)")

function updateBar(trials, speed){
    barX.domain(d3.range(trials.length)) //update bar scale

    legendText = trials.length > 0 ? ["Successes", "Failures"] : []

    var progressBar_legend = trialViz.selectAll(".legend")
        .data(legendText)

    progressBar_legend.exit()
        .transition().duration(speed)
        .attr("font-size", 0)

    progressBar_legend.enter()
        .append("text")
        .text(function(d){return d;})
        .attr("x", function(d,i){return i == 0 ? padding*3: width - padding*3})
        .attr("y", -10)
        .attr("text-anchor", function(d,i){return i == 0 ? "start": "end"})
        .attr("fill", function(d,i){return i == 0 ? successColor: failColor})
        .attr("font-size", 20)

    var progressBar = trialViz.selectAll(".progressBar")
        .data(trials, function(d){return d.id})

    progressBar.exit()
        .transition().duration(speed)
        .delay(function(d, i) { return trials.length > 150 ? 0: (trials.length - i) * 15; })
        .attr("y", -150)
        .attr("width", 0)
        .attr("height", 0)
        .remove()

    progressBar //existing trials
        .transition().duration(0)
        .attr("x", function(d,i){return barX(i)})
        .attr("width", barX.rangeBand())
        .attr("y", 0)
        .attr("fill", function(d){ return d.v == 1 ? successColor : failColor})
        .style("stroke-width", trials.length > 150 ? 0 : 0.5)

    progressBar.enter() //new trials
        .append("rect")
        .attr("class", "progressBar")
        .attr("x", width/2)
        .attr("y", -150)
        .attr("width", 20)
        .transition().duration(speed)
        .attr("x", function(d,i){return barX(i)})
        .attr("y", 0)
        .attr("width", barX.rangeBand())
        .attr("height", 20)
        .attr("fill", function(d){ return d.v == 1 ? successColor : failColor})
        .style("stroke", "black")
        .style("stroke-width", trials.length > 150 ? 0 : 0.5) //dont have borders if there are a lot of trials
}

var confInt = d3.select("svg")
    .append("g")
    .attr("class", "confidenceInterval")
    .attr("transform", "translate(0,450)")

//Draws the confidence interval for the current trials.
function confidenceInterval(trials, speed){

    //get our data on the interval by extracting trial results
    var intervalData = wilsonInterval(trials.map(function(d){return d.v}));

    var confInt_line = confInt.selectAll("line")
        .data([intervalData], function(d,i){return i;})

    confInt_line.exit()
        .transition().duration(speed)
        .attr("x1", width/2)
        .attr("x2", width/2)
        .remove()

    confInt_line
        .transition().duration(speed)
        .attr("x1", function(d){ return CIScale(d.lb)})
        .attr("x2", function(d){ return CIScale(d.ub)})

    confInt_line.enter()
        .append("line")
        .attr("class", "confidenceInterval")
        .attr("x1", width/2)
        .attr("x2", width/2)
        .attr("stroke", "black")
        .attr("stroke-width", "1")
        .transition().duration(speed)
        .attr("x1", function(d){ return CIScale(d.lb) + 18})
        .attr("x2", function(d){ return CIScale(d.ub) - 18})

    //bubbles for ends of ci.
    confInt_ends = confInt.selectAll("circle")
        .data([intervalData.lb, intervalData.ub])

    confInt_ends.exit()
        .transition().duration(speed)
        .attr("cx", width/2)
        .attr("r", 0)

    confInt_ends
        .transition().duration(speed)
        .attr("cx", function(d){ return CIScale(d)})
        .attr("r", 18)

    confInt_ends.enter()
        .append("circle")
        .attr("cx", function(d){ return CIScale(d)})
        .attr("r", 0)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .transition().duration(800)
        .attr("cx", function(d){ return CIScale(d)})
        .attr("r", 18)

    //bubbles for ends of ci.
    confInt_nums = confInt.selectAll("text")
        .data([intervalData.lb, intervalData.ub])

    confInt_nums.exit()
        .transition().duration(speed)
        .attr("x", width/2)
        .attr("font-size", 0)

    confInt_nums
        .transition().duration(speed)
        .attr("x", function(d){ return CIScale(d)})
        .text(function(d){return Math.round(d*100)/100;;})

    confInt_nums.enter()
        .append("text")
        .attr("x", function(d){ return CIScale(d)})
        .attr("y", 4)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .text(function(d){return Math.round(d*1000)/1000;})
        .transition().duration(800)
        .attr("x", function(d){ return CIScale(d)})
}


//Generate and add a new trial to the viz.
function addResult(res){
    idCounter += 1 //increment counter
    trials.push({"v":res, "id": idCounter}) //add new trial result
    trials.sort(function compareNumbers(a, b) {return b.v - a.v;}) //sort results
    updateBar(trials, speed) //update the trials bar with the new trial
    confidenceInterval(trials, speed) //update the confidence interval
    currentPVal = binomHypothesis(trials.length, numSuccess(trials), altHypothesisVal) //update the p-value
    var dispPVal = Math.round(currentPVal*1000)/1000 //format pvalue for display
    d3.select("#pValue").text(dispPVal == 0? "<0.001": dispPVal) //print

    //update the n and x boxes too.
    document.getElementById("customN").value = trials.length;
    document.getElementById("customX").value = numSuccess(trials);
}
//Allow the user to input a custom n and x value and then update the trials bar.
function customNX(){
    //grab values from the user form
    var n = +document.getElementById("customN").value;
    var x = +document.getElementById("customX").value;

    //if the user accidentally put more successes than trials fix it.
    if(x > n){document.getElementById("customX").value = n}

    var newTrials = [] //initialize holder for new trials
    for(var i = 0; i < n; i++){
        idCounter += 1 //increment counter
        //add ones until successes are done then finish with zeros.
        i < x ? newTrials.push({"v":1, "id": idCounter})
        : newTrials.push({"v":0, "id": idCounter})
    }
    trials = newTrials; //set global trials to our newly generated trials
    updateBar(trials, speed) //update the bar.
    confidenceInterval(trials, speed) //update the confidence interval
    currentPVal = binomHypothesis(trials.length, numSuccess(trials), altHypothesisVal) //update the p-value
    var dispPVal = Math.round(currentPVal*1000)/1000 //format pvalue for display
    d3.select("#pValue").text(dispPVal == 0? "<0.001": dispPVal) //print
}


//remove all the trials.
function reset(){
    idCounter = 1 //reset counter
    trials = [] // empty trials storage
    updateBar(trials, speed) //draw an empty trials bar.

    confInt.selectAll("line").remove() //remove confidence interval stuff.
    confInt.selectAll("circle").remove()
    confInt.selectAll("text").remove()
    trialViz.selectAll("text").remove()

    //update the n and x boxes too.
    document.getElementById("customN").value = 0;
    document.getElementById("customX").value = 0;
}

//button for generating a new trial.
var buttonStuff = [{color: buttonColor, text: "Generate Trial"}]

var genButton = d3.select("svg").append("g")
    .attr("class", "genButton")
    .attr("transform", "translate(" + (width/2) + ",100)")

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
    .on("click", function(){ addResult(bern(theta)) })

genButton.append("text")
    .attr("text-anchor", "middle")
    .text("Generate New Trial")
    .on("click", function(){ addResult(bern(theta)) })
    .style("pointer-events", "none")
    .style("user-select", "none")

//kick it off.
updateBar(trials, speed)

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
    })

probOfSuccess.noUiSlider.on('change', function(values, handle, unencoded){ //what to do when the slider is dropped.
        p_of_success = +values
        // updatePoints(rawData, confLevel, sizeVal)
        // take the given value, reset all the trials and start new.
        reset() //reset the visualization
        theta = p_of_success //change the theta.
    })

//Alternative hypothesis slider
var altHypothesis = document.getElementById('altHypothesis');

noUiSlider.create(altHypothesis, {
    start: 0.5,
	range: { min: 0, max: 1 },
});

var tipHandles2 = altHypothesis.getElementsByClassName('noUi-handle'),
	   tooltips2 = [];

// Add divs to the slider handles.I hate how clunky this is. Maybe submit a pr to the repo?
for ( var i = 0; i < tipHandles2.length; i++ ){
	tooltips2[i] = document.createElement('div');
	tipHandles2[i].appendChild(tooltips2[i]);
}

altHypothesis.noUiSlider.on('update', function(values, handle, unencoded){ //what to do when the slider is moved.
        tooltips2[handle].innerHTML = values[handle];
})

altHypothesis.noUiSlider.on('change', function(values, handle, unencoded){ //what to do when the slider is dropped.
        altHypothesisVal = +values
        currentPVal = binomHypothesis(trials.length, numSuccess(trials), altHypothesisVal)
        var dispPVal = Math.round(currentPVal*1000)/1000
        d3.select("#pValue").text(dispPVal == 0? "<0.001": dispPVal)
})
