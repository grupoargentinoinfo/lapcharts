// Dimensions.
const DIMENSIONS = getWindowDimensions();
const WIDTH = DIMENSIONS.width;
const HEIGHT = DIMENSIONS.height - 100;

// Insets.
const INSETS = {'left': 150, 'right': 150, 'top': 30, 'bottom': 50};

// Padding.
const PADDING = {'left': 5, 'right': 5, 'top': 5, 'bottom': 5};

// Tick-mark length.
const TICK_MARK_LENGTH = 5;

// Scales.
const SCALES = {};

// Opacity of dimmed objects.
var DIMMED_OPACITY = 0.2;
var HIGHLIGHT_OPACITY = 1.0;


// Visualize when document has loaded.
window.onload = function() {

    d3.json("2010au.json", function(json) {

        // Sort on finishing order.
        json.laps.sort(function(a, b) {

            var aLaps = a.placing.length;
            var bLaps = b.placing.length;
            return aLaps == bLaps ? a.placing[aLaps - 1] - b.placing[bLaps - 1] : bLaps - aLaps;
        });

        visualize(json);
    });
};

// Create the visualization.
function visualize(data) {

    SCALES.x = d3.scale.linear()
        .domain([0, data.lapCount])
        .range([INSETS.left, WIDTH - INSETS.right]);

    SCALES.y = d3.scale.linear()
        .domain([0, data.laps.length - 1])
        .range([INSETS.top, HEIGHT - INSETS.bottom]);

    SCALES.clr = d3.scale.category20();

    // Root panel.
    var vis = d3.select('#chart')
        .append('svg:svg')
        .attr('width', WIDTH)
        .attr('height', HEIGHT);

    // Lap tick-lines.
    vis.selectAll('line')
        .data(SCALES.x.ticks(data.lapCount))
        .enter().append('svg:line')
        .attr('class', 'tickLine')
        .attr('x1', function(d) {

            return SCALES.x(d);
        })
        .attr('x2', function(d) {

            return SCALES.x(d);
        })
        .attr('y1', SCALES.y.range()[0] - TICK_MARK_LENGTH)
        .attr('y2', SCALES.y.range()[1] + TICK_MARK_LENGTH)
        .attr('visibility', function(d) {

            return d > 0 ? 'visible' : 'hidden'
        });

    // Lap labels.
    vis.selectAll('text.lap')
        .data(SCALES.x.ticks(data.lapCount))
        .enter().append('svg:text')
        .attr('class', 'lap')
        .attr('x', function(d) {

            return SCALES.x(d);
        })
        .attr('y', SCALES.y.range()[0] - PADDING.bottom)
        .attr('text-anchor', 'middle')
        .text(function(d, i) {

            return i > 0 ? i : '';
        });

    // Add lap poly-lines.
    vis.selectAll('polyline')
        .data(data.laps)
        .enter()
        .append('svg:polyline')
        .attr('points', function(d) {

            var points = [];
            for (var i = 0;
                 i < d.placing.length;
                 i++) {

                points[i] = SCALES.x(i) + ',' + SCALES.y(d.placing[i] - 1);
            }

            return points.join(' ');
        })
        .style('stroke', function(d) {

            return SCALES.clr(d.placing[0]);
        })
        .on('mouseover', function(d, i) {

            highlight(vis, i);
        })
        .on('mouseout', function() {

            unhighlight(vis);
        });

    // Add name labels.
    vis.selectAll('text.name.start')
        .data(data.laps)
        .enter()
        .append('svg:text')
        .attr('class', 'name start')
        .attr('x', INSETS.left - PADDING.right)
        .attr('y', function (d) {

            return SCALES.y(d.placing[0] - 1);
        })
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .text(function(d) {

            return d.name;
        })
        .style('fill', function(d) {

            return SCALES.clr(d.placing[0]);
        })
        .on('mouseover', function(d, i) {

            highlight(vis, i);
        })
        .on('mouseout', function() {

            unhighlight(vis);
        });

    vis.selectAll('text.name.finish')
        .data(data.laps)
        .enter()
        .append('svg:text')
        .attr('class', 'name finish')
        .attr('x', WIDTH - INSETS.right + PADDING.left)
        .attr('y', function (d, i) {

            return SCALES.y(i);
        })
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .text(function(d) {

            return d.name;
        })
        .style('fill', function(d) {

            return SCALES.clr(d.placing[0]);
        })
}

// Highlight driver.
//
// vis: the data visualization root.
// index: index of driver to highlight.
//
function highlight(vis, index) {

    // Dim others.
    vis.selectAll('polyline')
        .style('opacity', function(d, i) {

            return i == index ? HIGHLIGHT_OPACITY : DIMMED_OPACITY;
        });

    vis.selectAll('text.name')
        .style('opacity', function(d, i) {

            return i == index ? HIGHLIGHT_OPACITY : DIMMED_OPACITY;
        });
}

// Remove highlights.
//
function unhighlight(vis) {

    // Reset colour.
    vis.selectAll('polyline')
        .style('opacity', HIGHLIGHT_OPACITY);
    vis.selectAll('text.name')
        .style('opacity', HIGHLIGHT_OPACITY);
}

// Gets the window dimensions.
//
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

