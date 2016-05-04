//just some nonsense to move objects to front easily.
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

var width = parseInt(d3.select("#viz").style("width").slice(0, -2)),
    height = $(window).height() - 85;

var svg = d3.select("#viz").append("svg")
    .attr("height", height)
    .attr("width", width)

//Binomial likelihood function.
function binLik(p, n , k){
    return Math.pow(p,k) * Math.pow((1-p), (n - k))
}

// Function that takes a range of p (0, 1) and calcuates the maximum val (MLE)
// then divides the rest of the results by that value to get a normalized likelihood
// Values, start = begining index, end = ending index, lik = likelihood function.
function likCurve(start, end, lik){
    var largest = 0 //initiate variable to hold largest value
    //in a loop calculate all value based on likelihood
    //At each timestep check to see if it's the largest and store if it is

    //divide resultant vector elements by the largest value.

    //return normalized vector.
}
