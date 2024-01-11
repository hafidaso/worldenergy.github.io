// Set up the SVG canvas dimensions
const width = 900;
const height = 750;
const margin = { top: 20, right: 200, bottom: 80, left: 70 };

// Append the SVG to the body
const svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

// Load the data from the CSV file
d3.csv('data/world_clean_dataset.csv').then(data => {
    // Extract unique years from the dataset
    const years = Array.from(new Set(data.map(d => +d.year)));

    // Set the default selected year
    let selectedYearDefault = 2000

    const yearFilter = d3.select("#yearFilter")
        .selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .text(d => d);

    // Function to update visualization based on the selected year
    function updateVisualization(selectedYear) {
        console.log(selectedYear);
        // Filter data for the selected year
        const filteredData = data.filter(d => +d.year === selectedYear);

        console.log(filteredData);

        // Select the top 5 most populated countries
        const top5Countries = filteredData
            .sort((a, b) => b.population - a.population)
            .slice(0, 5);

        const maxFossilFuel = d3.max(top5Countries, d => +d.fossil_fuel_consumption);
        const maxRenewables = d3.max(top5Countries, d => +d.renewables_consumption);

        // Set the domain for the x and y scales
        const maxDomain = Math.max(maxFossilFuel, maxRenewables);

        const xScale = d3.scaleLinear()
            .domain([0, maxDomain])
            .range([margin.left, width - margin.right]);

        const yScale = d3.scaleLinear()
            .domain([0, maxDomain * 0.75])
            .range([height - margin.bottom, margin.top]);

        const radiusScale = d3.scaleLinear()
            .domain([0, d3.max(top5Countries, d => +d.gdp)])
            .range([5, 30]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        svg.select('.x-axis')
            .transition()
            .duration(500)
            .call(xAxis);

        svg.select('.y-axis')
            .transition()
            .duration(500)
            .call(yAxis);

        const bubbles = svg.selectAll('circle')
            .data(top5Countries);

        const newBubbles = bubbles.enter()
            .append('circle')
            .attr('opacity', 0)
            .merge(bubbles);

        newBubbles.transition()
            .duration(500)
            .attr('cx', d => xScale(+d.fossil_fuel_consumption))
            .attr('cy', d => yScale(+d.renewables_consumption))
            .attr('r', d => radiusScale(+d.gdp))
            .attr('fill', d => colorScale(d.country))
            .attr('opacity', 0.7);

        // formatedGDP = (d.gdp / 1e12).toLocaleString() + " T";

        newBubbles.select('title') // Tooltip
            .text(d => `
            <strong>${d.country}</strong>
            <strong>\nFossil Fuel Consumption: </strong>${d.fossil_fuel_consumption + " kWh"}
            <strong>\nRenewables Consumption: </strong>${d.renewables_consumption + " kWh"}
            <strong>\nGDP: </strong>${(d.gdp / 1e12).toLocaleString() + " T"}
            `);

        newBubbles.on('mouseover', function (event, d) {
            const tooltipContent = `
            <strong>${d.country}</strong>
            <strong><br>Fossil Fuel Consumption: </strong>${d.fossil_fuel_consumption + " kWh"}
            <strong><br>Renewables Consumption: </strong>${d.renewables_consumption + " kWh"}
            <strong><br>GDP: </strong>${(d.gdp / 1e12).toLocaleString() + " T"}
            `;
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);
            tooltip.html(tooltipContent)
                .style('left', (event.pageX) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
            .on('mouseout', function () {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
        // Add legends
        const legend = svg.selectAll('.legend')
            .data(top5Countries)
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', (d, i) => `translate(${width - margin.right + 20},${margin.top + i * 20})`);

        legend.append('rect')
            .attr('x', 0)
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', d => colorScale(d.country));

        legend.append('text')
            .attr('x', 24)
            .attr('y', 9)
            .attr('dy', '.35em')
            .style('text-anchor', 'start')
            .style('fill', 'white')  // Set text color to white using style
            .text(d => d.country);
    }

    // Initial visualization
    updateVisualization(selectedYearDefault);

    // Add event listener for year selection
    d3.select('#yearFilter').on('change', function () {
        selectedYear = +this.value;
        updateVisualization(selectedYear);
    });

    // Define the tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    // Add x-axis
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom().scale(d3.scaleLinear()));

    // Add y-axis
    svg.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft().scale(d3.scaleLinear()));

    // Add x-axis label
    svg.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', width / 2)
        .attr('y', height - 10)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .style('fill', 'white') // Set text color to white using style
        .text('Fossil Fuel Consumption (kWh)');

    // Add y-axis label
    svg.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', 10)
        .attr('dy', '1em')
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .style('fill', 'white') // Set text color to white using style
        .text('Renewables Consumption (kWh)');
});