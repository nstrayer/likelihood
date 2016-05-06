// Array Sum.
// For some reason javascript doesn't have a quick conceise method of summing an array. Let's make one
// Input: Array of numerical values (arr)
function sumArray(arr){
    var s = 0
    arr.forEach(function(d){s = s + d})
    return(s)
}

//Number of successes for getting info out of jsonified results
function numSuccess(trials){ return sumArray(trials.map(function(d){return d.v})) }


// Bernoulli trial function.
// This function takes the parameter p, which is the probability of success.
// It returns either a 1 (success) or 0 (failure)
function bern(p){ return(Math.random() < p ? 1 : 0)}

// Binomial trial draw.
// input:
// n = number of trials to simulate
// p = probability of success
// Returns:
// a vector of trials.
function binomialDraw(n,p){
    trials = []
    for(var i = 0; i < n; i++){trials.push(bern(p))}
    return trials;
}

// Wald interval function 95%
// Input:
// vector (trials) of successes (1) and failures (0)
// Returns:
// point estimate (pe),
// lower bound of CI (lb),
// upper bound (ub) and
// width of interval (width).
function waldInterval(trials){
    var n = trials.length
    var z = 1.96 //Hard coding this value for now, eventually we will be able to adjust width
    var pe = sumArray(trials)/n //point estimate. Simply success/trials
    var intW = z * Math.sqrt((1/n) * pe*(1 - pe)) //width of the interval
    return({
        "pe": pe,
        "lb": (pe - intW) < 0 ? 0: (pe - intW),
        "ub": (pe + intW) > 1 ? 1: (pe + intW) ,
        "width": intW*2
    })
}

//Wilson Interval 95%
//Same as wald but success = x + 2, trials = n + 4. Improves coverage.
//Input vector (trials) of successes (1) and failures (0)
// Returns:
// point estimate (pe),
// lower bound of CI (lb),
// upper bound (ub) and
// width of interval (width).
function wilsonInterval(trials){
    trials.push(1,1,0,0) //increase successes by 2, trials by 4
    return(waldInterval(trials)) //run the wald interval again.
}


// gaussian error function
// Used to simulate the normal cdf. 
function errorFunction(x) {
    var t = 1 / (1 + 0.5 * Math.abs(x));
    var tau = t * Math.exp(-Math.pow(x, 2) -
        1.26551223 +
        1.00002368 * t +
        0.37409196 * Math.pow(t, 2) +
        0.09678418 * Math.pow(t, 3) -
        0.18628806 * Math.pow(t, 4) +
        0.27886807 * Math.pow(t, 5) -
        1.13520398 * Math.pow(t, 6) +
        1.48851587 * Math.pow(t, 7) -
        0.82215223 * Math.pow(t, 8) +
        0.17087277 * Math.pow(t, 9));

    return x >= 0 ? (1 - tau) : (tau - 1);
}

//Put in a test statistic and get out the p-value associated with it.
function stdNormalCdf(z){
    return (.5 + .5 * errorFunction(z / Math.sqrt(2)) )
}

// Binomial hypothesis test. (Two sided)
// Input:
// n = number of trials
// x = number of successes
// theta = alternative hypothesis.
// Output:
// t = test statistic
// pVal = p-value for alternative hypothesis.
function binomHypothesis(n, x, theta){
    var obsTheta = x/n
    var t = (Math.sqrt(n) * (obsTheta - theta))/(Math.sqrt(theta*(1 - theta)))
    // If calc p-value in correct direction.
    return t < 0 ? 2*(stdNormalCdf(t)) : 2*(1 - stdNormalCdf(t));
}
