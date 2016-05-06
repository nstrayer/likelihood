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

var x_scale = d3.time.scale()
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

var lineStart = d3.svg.line()
    .x(function(d){return x_scale(d.p)})
    .y(function(d){return y_scale(0)});

var line = d3.svg.line()
    .x(function(d){return x_scale(d.p)})
    .y(function(d){return y_scale(d.likelihood)});

svg.append("path")
      .datum(likCurve(0, 1, 10, 8))
      .attr("class", "line")
      .attr("d", lineStart)
      .transition().duration(700)
      .attr("d", line);

// Function to update the likelihood curve with new data.
function updateCurve(n,k){
    svg.select("path")
        .datum(likCurve(0, 1, n, k))
        .transition().duration(700)
        .attr("d", line);
}

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
var intervals = [lik_int(1/8,  likCurve(0, 1, 10, 8))]
intervals.push(  lik_int(1/16, likCurve(0, 1, 10, 8)))

var support_ints = svg
    .append("g")
    .attr("class", "intervals")

//Function to add, remove, or move intervals.
function draw_intervals(intervals_data){
    var speed = 800;
    var interval_line = support_ints.selectAll(".interval")
            .data(intervals_data)

    interval_line.exit()
        .transition().duration(speed)
        .attr("x1", width/2)
        .attr("x2", width/2)
        .remove()

    interval_line
        .transition().duration(speed)
        .attr("x1", function(d){return x_scale(d.left) }  )
        .attr("x2", function(d){return x_scale(d.right)}  )

    interval_line.enter()
        .append("line")
        .attr("id", ƒ('lik'))
        .attr("class", "intervals")
        .attr("x1", function(d){return x_scale((d.right + d.left)/2) }  )
        .attr("x2", function(d){return x_scale((d.right + d.left)/2) }  )
        .attr("y1", function(d){return y_scale(d.lik)  }  )
        .attr("y2", function(d){return y_scale(d.lik)  }  )
        .transition().duration(speed)
        .attr("x1", function(d){return x_scale(d.left) }  )
        .attr("x2", function(d){return x_scale(d.right)}  )
        .attr("stroke", "red")
        .attr("stroke-width", 1)

    var interval_text = support_ints.selectAll(".intervalText")
            .data(intervals_data)
            .enter()
            .append("g")

    // interval_text.exit()
    //     .transition().duration(speed)
    //     .attr("x", 0)
    //     .remove()
    //
    // interval_text
    //     .transition().duration(speed)
    //     .attr("x", function(d){return x_scale(d.left) }  )

    var leftText = interval_text
        .append("text")
        .attr("class", "intervalText")
        .attr("text-anchor", "right")
        .attr("font-size", 12)
        .attr("x", function(d){return x_scale(d.left) - 42 }  )
        .attr("y", function(d){return y_scale(d.lik) - 2 }  )
        .text( function(d){return Math.round(d.left*1000)/1000  }  )
        .attr("font-family", "Optima")
        .attr("font-size", 18);

    var rightText = interval_text
        .append("text")
        .attr("class", "intervalText")
        .attr("text-anchor", "left")
        .attr("font-size", 12)
        .attr("x", function(d){return x_scale(d.right) }  )
        .attr("y", function(d){return y_scale(d.lik) - 2 }  )
        .text( function(d){return Math.round(d.right*1000)/1000  }  )
        .attr("font-family", "Optima")
        .attr("font-size", 18);
}

draw_intervals(intervals)
