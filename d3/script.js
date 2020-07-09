let dimensions = {
	width  : window.innerWidth * 0.8,
	height : window.innerHeight * 0.8,
	margin : {
		top    : 15,
		right  : 15,
		bottom : 65,
		left   : 60
	}
};
dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

const svg = d3.select('#my_dataviz').append('svg').attr('width', dimensions.width).attr('height', dimensions.height);

const bounds = svg.append('g').attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`);

bounds
	.append('defs')
	.append('clipPath')
	.attr('id', 'bounds-clip-path')
	.append('rect')
	.attr('width', dimensions.boundedWidth)
	.attr('height', dimensions.boundedHeight);

// Color legend.
var colorScale = d3.scaleOrdinal().domain([ 'Automatic', 'Unknown', 'Optional', 'None' ]).range(d3.schemeCategory10);

var colorLegend = d3
	.legendColor()
	.ascending(true)
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

const tip = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);

const formatMonthDay = d3.timeFormat('%B %d');
const color = d3.scaleOrdinal(d3.schemeCategory10);

//Read the data
d3.csv('processed.csv', function(data) {
	data.forEach(function(d) {
		d.index = +d.index;
		// restructure dates so they are not indexed one backwards
		// https://stackoverflow.com/a/31732581
		d.date = new Date(d.date.replace(/-/g, '/'));
	});
	console.table(data);

	var mindate = d3.min(data, function(d) {
		return d.date;
	});
	var maxdate = d3.max(data, function(d) {
		return d.date;
	});

	var ticks = [
		new Date('2020-02-01'),
		new Date('2020-03-01'),
		new Date('2020-04-01'),
		new Date('2020-05-01'),
		new Date('2020-06-01'),
		maxdate
	];
	var tickLabels = [ 'February', 'March', 'April', 'May', 'June', 'July' ];

	const max_num_events = d3.max(data, function(d) {
		return d.index;
	});

	var barHeight = dimensions.boundedHeight / max_num_events;
	var x = d3.scaleTime().domain([ mindate, maxdate ]).range([ 0, dimensions.boundedWidth ]);

	var xAxisGenerator = d3.axisBottom(x);

	xAxisGenerator.tickSizeOuter(0).tickValues(ticks).tickFormat(function(d, i) {
		return tickLabels[i];
	});

	bounds
		.append('g')
		.attr('transform', 'translate(0,' + dimensions.boundedHeight + ')')
		.call(xAxisGenerator)
		.attr('class', 'x axis');

	// y axis
	var yTicks = [ 0, 10, 20, 30 ];
	var yTickLabels = [ 0, 10, 20, 30 ];

	const y = d3.scaleLinear().domain([ 0, max_num_events ]).range([ dimensions.boundedHeight, 0 ]);

	var yAxisGenerator = d3.axisLeft(y);

	yAxisGenerator.tickSizeOuter(0).tickValues(yTicks).tickFormat(function(d, i) {
		return yTickLabels[i];
	});

	bounds.append('g').attr('transform', 'translate(-2' + ',0)').call(yAxisGenerator).attr('class', 'y axis');

	const rects = bounds
		.selectAll('rect')
		.data(data)
		.enter()
		.append('rect')
		.attr('width', 6)
		.attr('height', barHeight * 0.95)
		.attr('fill', function(d) {
			return color(d.refund);
		})
		.attr('x', 0)
		.attr('y', function(d) {
			return y(d.index);
		});

	console.log(y(25));

	rects
		.transition()
		.delay(function(d, i) {
			return i * 2;
		})
		.duration(1000)
		.attr('x', function(d) {
			return x(d.date);
		})
		.on('end', function(d, i) {
			d3
				.select(this)
				.on('mouseover', function(d, i) {
					d3.select(this).transition().duration(500).attr('fill', 'grey');

					tip.transition().duration(100).style('opacity', 1);
					tip.html(
						'<div class = "tiptitle"><span style="font-weight:bold;">' +
							d.artist_festival_name +
							'</span>, ' +
							'Cancelled on ' +
							formatMonthDay(d.date) +
							'</div>' +
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
});
