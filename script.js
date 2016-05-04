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
// Values, start = begining index, end = ending index, n = num trials, k = successes
function likCurve(start, end, n, k){
    var largest = 0 //initiate variable to hold largest value

    //generate a vector 1000 elements long
    var p = d3.range(start,end,(end-start)/1000)

    //array to hold the results of likelihood
    var curve = []

    //in a loop calculate all value based on likelihood
    //At each timestep check to see if it's the largest and store if it is
    p.forEach(function(val){

        likelihoodVal = binLik(val, n , k)
        //push to curve vector
        curve.push(likelihoodVal)

        //check to see if the current value is bigger than the largest seen yet, if it is make it the new largest
        largest = likelihoodVal > largest ? likelihoodVal : largest
    })
    //divide resultant vector elements by the largest value.
    var normalized_curve = curve.map(function(x){ return x / largest});

    //return normalized vector.
    return normalized_curve
}
