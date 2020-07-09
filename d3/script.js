let dimensions = {
	width  : window.innerWidth * 0.8,
	height : window.innerHeight * 0.9,
	margin : {
		top    : 15,
		right  : 15,
		bottom : 65,
		left   : 15
	}
};
dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

const svg = d3
	.select('#my_dataviz')
	.append('svg')
	.attr('width', dimensions.width)
	.attr('height', dimensions.height)
	.call(responsivefy);

// Color legend.
var colorScale = d3.scaleOrdinal().domain([ 'Automatic', 'Unknown', 'Optional', 'None' ]).range(d3.schemeCategory10);

var colorLegend = d3
	.legendColor()
	.labelFormat(d3.format('.0f'))
	.scale(colorScale)
	.shapePadding(5)
	.shapeWidth(50)
	.shapeHeight(20)
	.labelOffset(12);

var legendObj = svg.append('g').attr('transform', `translate(${dimensions.width * 0.7} , 60)`).call(colorLegend);

legendObj
	.append('text')
	.text('Refund approach')
	.attr('transform', 'translate(0, -12)')
	.attr('font-size', '1.25rem')
	.attr('font-weight', '500');

function responsivefy(svg) {
	// get container + svg aspect ratio
	var container = d3.select(svg.node().parentNode),
		width = parseInt(svg.style('width')),
		height = parseInt(svg.style('height')),
		aspect = width / height;

	// add viewBox and preserveAspectRatio properties,
	// and call resize so that svg resizes on inital page load
	svg.attr('viewBox', '0 0 ' + width + ' ' + height).attr('perserveAspectRatio', 'xMinYMid').call(resize);

	// to register multiple listeners for same event type,
	// you need to add namespace, i.e., 'click.foo'
	// necessary if you call invoke this function for multiple svgs
	// api docs: https://github.com/mbostock/d3/wiki/Selections#on
	d3.select(window).on('resize.' + container.attr('id'), resize);

	// get width of container and resize svg to fit it
	function resize() {
		var targetWidth = parseInt(container.style('width'));
		svg.attr('width', targetWidth);
		svg.attr('height', Math.round(targetWidth / aspect));
	}
}

svg
	.append('defs')
	.append('clipPath')
	.attr('id', 'svg-clip-path')
	.append('rect')
	.attr('width', dimensions.boundedWidth)
	.attr('height', dimensions.boundedHeight)
	.attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`);

const tip = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);

const formatMonthDay = d3.timeFormat('%B %d');
const color = d3.scaleOrdinal(d3.schemeCategory10);

//Read the data
d3.csv('processed.csv', function(data) {
	data.forEach(function(d) {
		d.index = +d.index;
		d.date = new Date(d.date);
	});

	// const xAccessor = (d) => new Date(d.date);
	console.table(data);

	var mindate = d3.min(data, function(d) {
		return d.date;
	});
	var maxdate = d3.max(data, function(d) {
		return d.date;
	});

	var ticks = [ mindate, maxdate ];
	var tickLabels = [ 'January', 'July' ];

	var x = d3.scaleTime().domain([ mindate, maxdate ]).range([ 0, dimensions.boundedWidth ]);

	var xAxisGenerator = d3.axisBottom(x);

	xAxisGenerator.tickValues(ticks).tickFormat(function(d, i) {
		return tickLabels[i];
	});

	var xAxis = svg.append('g').attr('transform', 'translate(0,' + dimensions.boundedHeight + ')').call(xAxisGenerator);

	xAxis.selectAll('text').attr('font-size', '1rem').style('text-anchor', function(d, i) {
		if (tickLabels[i] == 'January') {
			return 'start';
		} else {
			return 'end';
		}
	});

	// Add Y axis
	const max_num_events = d3.max(data, function(d) {
		return d.index;
	});
	const y = d3.scaleLinear().domain([ 0, max_num_events ]).range([ dimensions.boundedHeight, 0 ]);

	svg.append('g').call(d3.axisLeft(y)).attr('class', 'y axis');

	const rects = svg
		.selectAll('rect')
		.data(data)
		.enter()
		.append('rect')
		// .attr('fill', 'none')
		.attr('width', 6)
		.attr('height', 22)
		.attr('fill', function(d) {
			return color(d.refund);
		})
		.attr('x', 0)
		.attr('y', function(d) {
			return y(d.index);
		})
		// .transition()
		// .delay(function(d, i) {
		// 	return i * 2;
		// })
		// .duration(1000)
		.attr('x', function(d) {
			return x(d.date);
		})
		.on('mouseover', function(d, i) {
			d3.select(this).transition().duration(500).attr('fill', 'grey');

			tip.transition().duration(100).style('opacity', 1);
			tip.html(
				'<span style="font-weight:bold;">' +
					d.artist_festival_name +
					'</span>, ' +
					'Cancelled on ' +
					formatMonthDay(d.date) +
					'<hr>' +
					'<i>Genre: </i>' +
					d.genre +
					'<br><i>Refund approach: </i> ' +
					d.refund
			);
			tip
				.style('visibility', 'visible')
				.style('left', d3.event.pageX + 10 + 'px')
				.style('top', d3.event.pageY - 35 + 'px');
		})
		.on('mousemove', function(d) {
			tip.style('left', d3.event.pageX + 10 + 'px').style('top', d3.event.pageY - 65 + 'px');
		})
		.on('mouseout', function(d, i) {
			d3.select(this).transition().duration(500).attr('fill', function(d) {
				return color(d.refund);
			});
			tip.transition().duration(500);
			tip.style('visibility', 'hidden');
		});
});
