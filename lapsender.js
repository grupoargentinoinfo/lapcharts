// dimensions.
const width = $(window).width();
const height = $(window).height() - 100;

console.log("body");
$(function() {
console.log("function");

    var container = $("#placeholder");
    container.width(width);
    container.height(height);

    var plot;
    var series;

    var laps = new io.connect('http://' + window.location.host.split(":")[0] + ':8001/laps');

    // Establish event handlers
    laps.on('disconnect', function() {
        sock.socket.reconnect();
    });

    laps.on('message', function(data) {
        console.log(data);

        switch (data.type) {
            case "init":
                console.log("Draw plot");
                series = data.data;
                init_plot(data.data);
                break;
            case "gap":
                console.log("Update plot with gap data " + data.data);
                update_plot(data.data);
                break;
            default:
                console.log("Unknown type " + data.type);
        };
    });

    function init_plot(series) {

        plot = $.plot(container, series, {
            grid: {
                borderWidth: 1,
                minBorderMargin: 20,
                labelMargin: 10,
                backgroundColor: {
                    colors: ["#fff", "#e4f4f4"]
                },
                margin: {
                    top: 8,
                    bottom: 20,
                    left: 20
                },
                clickable: true,
                autoHighlight: false,
            },
            xaxis: {
                ticks: 10,
                datamin: 180,
            },
            yaxis: {
                //min: 0,
                //max: 110
            },
            zoom: {
                interactive: true
            },
            pan: {
                interactive: true
            },
            legend: {
                show: true,
                position: "sw",
                hideable: true,
                sorted: "ascending",
            },
        });

        $(container).bind("plotclick", function (event, pos, item) {
            // axis coordinates for other axes, if present, are in pos.x2, pos.x3, ...
            // if you need global screen coordinates, they are pos.pageX, pos.pageY

            if (item) {
                alpha = 0.3;
                if (item.series.selected) {
                    item.series.selected = false;
                    alpha = 1;
                } else {
                    item.series.selected = true;
                }

                $.each(plot.getData(), function () {
                    if (this.label != item.series.label) {
                        c = $.color.parse(this.color);
                        c.a = alpha;
                        this.color = c.toString();
                    }
                });
                plot.draw();
            }
        });

        // add zoom out button 

        $("<div class='button' style='left:120px;bottom:120px'>zoom out</div>")
            .appendTo(container)
            .click(function (event) {
                event.preventDefault();
                plot.zoomOut();
            });

        // add reset buutton

        $("<div class='button' style='left:143px;bottom:80px'>R</div>")
            .appendTo(container)
            .click(function (event) {
                event.preventDefault();
                $.each(plot.getAxes(), function (_, axis) {
                    var opts = axis.options;
                    opts.min = opts.orig_min;
                    opts.max = opts.orig_max;
                    console.log(axis);
                    plot.setupGrid();
                    plot.draw();
                });
            });
        // and add panning buttons

        // little helper for taking the repetitive work out of placing
        // panning arrows

        function addArrow(dir, left, bottom, offset) {
            $("<img class='button' src='arrow-" + dir + ".gif' style='left:" + left + "px;bottom:" + bottom + "px'>")
                .appendTo(container)
                .click(function (e) {
                    e.preventDefault();
                    plot.pan(offset);
                });
        }

        addArrow("left", 125, 80, { left: -100 });
        addArrow("right", 155, 80, { left: 100 });
        addArrow("up", 140, 95, { top: -100 });
        addArrow("down", 140, 65, { top: 100 });

        $.each(plot.getAxes(), function (_, axis) {
            var opts = axis.options;
            opts.orig_min = axis.min;
            opts.orig_max = axis.max;
            console.log(axis);
        });

    };

    function update_plot(gap) {
        //console.log(gap);
        //console.log(series);

        for (var i = 0; i < series.length; i++) {
            if (series[i].regno == gap[0]) {
                series[i].data.push([gap[1], gap[2]]);
            }
        }

        plot.setData(series);
        plot.setupGrid();
        plot.draw();
    };

});

