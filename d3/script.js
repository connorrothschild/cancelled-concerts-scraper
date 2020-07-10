let dimensions = {
	width  : window.innerWidth * 0.9,
	height : window.innerHeight * 0.8,
	margin : {
		top    : 65,
		right  : 65,
		bottom : 65,
		left   : 65
	}
};
dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

var debouncedResize = debounce(function() {
	dimensions = {
		width  : window.innerWidth * 0.9,
		height : window.innerHeight * 0.8,
		margin : {
			top    : 65,
			right  : 65,
			bottom : 65,
			left   : 65
		}
	};
	dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
	dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

	init(dimensions.width, dimensions.height, dimensions.boundedHeight, dimensions.boundedWidth);
}, 500);

window.addEventListener('resize', debouncedResize);

function init(adjustedWidth, adjustedHeight, adjustedBoundedHeight, adjustedBoundedWidth) {
	d3.select('svg').remove();

	const svg = d3.select('#my_dataviz').append('svg').attr('width', adjustedWidth).attr('height', adjustedHeight);

	const bounds = svg.append('g').attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`);

	bounds
		.append('defs')
		.append('clipPath')
		.attr('id', 'bounds-clip-path')
		.append('rect')
		.attr('width', adjustedBoundedWidth)
		.attr('height', adjustedBoundedHeight);
	// Color legend.
	var colorScale = d3
		.scaleOrdinal()
		.domain([ 'Automatic', 'None', 'Optional', 'Unknown' ])
		.range(d3.schemeCategory10);

	var colorLegend = d3
		.legendColor()
		.ascending(true)
		.labelFormat(d3.format('.0f'))
		.scale(colorScale)
		.shapePadding(5)
		.shapeWidth(50)
		.shapeHeight(20)
		.labelOffset(12);

	var legendObj = svg
		.append('g')
		.attr('transform', `translate(${adjustedWidth * 0.7} , 60)`)
		.call(colorLegend)
		.attr('class', 'legend');

	legendObj
		.append('text')
		.text('Refund approach')
		.attr('class', 'legendTitle')
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
		// console.table(data);

		var mindate = d3.min(data, function(d) {
			return d.date;
		});
		var maxdate = d3.max(data, function(d) {
			return d.date;
		});

		numDays = (maxdate - mindate) / 86400000;

		barWidth = adjustedBoundedWidth / numDays * 0.95;

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

		var barHeight = adjustedBoundedHeight / max_num_events;
		var x = d3.scaleTime().domain([ mindate, maxdate ]).range([ 0, adjustedBoundedWidth ]);

		var xAxisGenerator = d3.axisBottom(x);

		xAxisGenerator.tickSizeOuter(0).tickValues(ticks).tickFormat(function(d, i) {
			return tickLabels[i];
		});

		bounds
			.append('g')
			.attr('transform', 'translate(0,' + adjustedBoundedHeight + ')')
			.call(xAxisGenerator)
			.attr('class', 'x axis');

		// y axis
		var yTicks = [ 0, 10, 20 ];
		var yTickLabels = [ 0, 10, 20 ];

		const y = d3.scaleLinear().domain([ 0, max_num_events ]).range([ adjustedBoundedHeight, 0 ]);

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
			.attr('width', barWidth)
			.attr('height', barHeight * 0.95)
			.attr('fill', function(d) {
				return color(d.refund);
			})
			.attr('x', 0)
			.attr('y', function(d) {
				return y(d.index);
			});

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
								d.status_rescheduled_postponed_cancelled.toLowerCase() +
								' on ' +
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
}

init(dimensions.width, dimensions.height, dimensions.boundedHeight, dimensions.boundedWidth);
