var width = parseInt(d3.select("body").style("width").slice(0, -2)),
    height = $(window).height() - 30,
    padding = 20;

var svg = d3.select("#viz").append("svg")
    .attr("width", width)
    .attr("heigh", height)
