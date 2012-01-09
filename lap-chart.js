// Dimensions.
const DIMENSIONS = getWindowDimensions();
const WIDTH = DIMENSIONS.width;
const HEIGHT = DIMENSIONS.height - 100;

// Insets.
const INSETS = {'left': 200, 'right': 200, 'top': 50, 'bottom': 50};

// Padding.
const PADDING = {'left': 5, 'right': 5, 'top': 5, 'bottom': 5};

// Data.
const LAP_COUNT = 9;
const LAPS = [
    {
        'name': 'Sebastian Vettel',
        'placing': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    },
    {
        'name': 'Fellipe Massa',
        'placing': [2, 3, 3, 3, 3, 3, 3, 3, 3, 3]
    },
    {
        'name': 'Fernando Alonso',
        'placing': [3, 2, 2, 2, 2, 2, 2, 2, 2, 2]
    },
    {
        'name': 'Lewis Hamilton',
        'placing': [4, 5, 5, 5, 5, 5, 5, 5, 5, 5]
    },
    {
        'name': 'Nico Rosberg',
        'placing': [5, 4, 4, 4, 4, 4, 4, 4, 4, 4]
    }
];

// Visualize when document has loaded.
window.onload = function() {

    visualize(LAPS);
};

// Create the visualization.
function visualize(data) {

    // Create scales.
    var scales = {};

    scales.x = d3.scale.linear()
        .domain([0, LAP_COUNT])
        .range([INSETS.left, WIDTH - INSETS.right]);

    scales.y = d3.scale.linear()
        .domain([0, data.length - 1])
        .range([INSETS.top, HEIGHT - INSETS.bottom]);

    scales.clr = d3.scale.category20();

    // Root panel.
    var vis = d3.select('#chart')
        .append('svg:svg')
        .attr('width', WIDTH)
        .attr('height', HEIGHT);


    // Lap tick-lines.
    vis.selectAll("line")
        .data(scales.x.ticks(LAP_COUNT))
        .enter().append("svg:line")
        .attr("class", "tickLine")
        .attr("x1", function(d) {
            return scales.x(d);
        })
        .attr("x2", function(d) {
            return scales.x(d);
        })
        .attr("y1", scales.y.range()[0])
        .attr("y2", scales.y.range()[1]);

    // Lap labels.
    vis.selectAll("text.lap")
        .data(scales.x.ticks(LAP_COUNT))
        .enter().append("svg:text")
        .attr("class", "lap")
        .attr("x", function(d) {
            return scales.x(d);
        })
        .attr("y", scales.y.range()[0] - PADDING.bottom)
        .attr("text-anchor", "middle")
        .text(function(d, i) {
            return i;
        });

    // Add lap poly-lines.
    vis.selectAll('polyline')
        .data(data)
        .enter()
        .append('svg:polyline')
        .attr('points', function(d) {

            var points = [];
            for (var i = 0;
                 i < d.placing.length;
                 i++) {

                points[i] = scales.x(i) + ',' + scales.y(d.placing[i] - 1);
            }

            return points.join(' ');
        })
        .style('stroke', function(d, i) {
            return scales.clr(i);
        });

    // Add name labels.
    vis.selectAll("text.name")
        .data(data)
        .enter()
        .append("svg:text")
        .attr("class", "name")
        .attr("x", INSETS.left - PADDING.right)
        .attr("y", function (d, i) {

            return scales.y(i);
        })
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(function(d) {

            return d.name;
        })
        .style('fill', function(d, i) {
            return scales.clr(i);
        });
}

// Gets the window dimensions.
function getWindowDimensions() {

    var width = 630;
    var height = 460;
    if (document.body && document.body.offsetWidth) {

        width = document.body.offsetWidth;
        height = document.body.offsetHeight;
    }

    if (document.compatMode == 'CSS1Compat' && document.documentElement && document.documentElement.offsetWidth) {

        width = document.documentElement.offsetWidth;
        height = document.documentElement.offsetHeight;
    }

    if (window.innerWidth && window.innerHeight) {

        width = window.innerWidth;
        height = window.innerHeight;
    }

    return {'width': width, 'height': height};
}

