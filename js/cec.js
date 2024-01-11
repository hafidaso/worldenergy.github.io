// Set up dimensions for the chart
const margin = { top: 120, right: 170, bottom: 50, left: 170 };
const width = 1200 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom;

// Append SVG to the body
const svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Parse the date/time
const parseDate = d3.timeParse("%Y");

// Load data from CSV file
d3.csv("data/world_clean_dataset.csv").then(data => {
    // Extract unique countries
    const countries = [...new Set(data.map(d => d.country))];

    // Populate the country dropdown menu
    d3.select("#countrySelect")
        .selectAll("option")
        .data(countries)
        .enter().append("option")
        .text(d => d)
        .attr("value", d => d);

    // Initialize with the first country
    const selectedCountry = countries[0];
    updateChart(selectedCountry);

    // Update chart when a new country is selected
    d3.select("#countrySelect").on("change", function () {
        const selectedCountry = this.value;
        updateChart(selectedCountry);
    });

    function updateChart(country) {
        // Filter data based on selected country
        const filteredData = data.filter(d => d.country === country);

        // Convert data types
        filteredData.forEach(d => {
            d.year = parseDate(d.year);
            d.coal = +d.coal_cons_per_capita;
            d.gas = +d.gas_energy_per_capita;
            d.hydro = +d.hydro_elec_per_capita;
            d.lowCarbon = +d.low_carbon_energy_per_capita;
            d.oil = +d.oil_energy_per_capita;
        });

        // Stack the data
        const keys = ["coal", "gas", "hydro", "lowCarbon", "oil"];
        const stack = d3.stack().keys(keys);
        const stackedData = stack(filteredData);

        // Define color scale
        const color = d3.scaleOrdinal()
            .domain(keys)
            .range(d3.schemeCategory10);

        // Set up scales
        const x = d3.scaleTime().domain(d3.extent(filteredData, d => d.year)).range([0, width]);
        const y = d3.scaleLinear().domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])]).range([height, 0]);

        // Set up area generator
        const area = d3.area()
            .x(d => x(d.data.year))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]));

        // Remove existing areas
        svg.selectAll("path").remove();

        // Create tooltip element
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Add the areas to the chart
        svg.selectAll("path")
            .data(stackedData)
            .enter().append("path")
            .attr("class", d => `area ${d.key}`)
            .attr("d", area)
            .style("fill", d => color(d.key))
            .on("mouseover", function (event, d) {
                // Highlight the area on mouseover
                d3.select(this)
                    .style("opacity", 0.8)
                    .style("stroke", "black")
                    .style("stroke-width", 2);

                // Tooltip code with adjusted positioning and formatting
                const total = d3.sum(d, d => d[1] - d[0]);

                // Calculate total fuel consumption across all years for all fuel types
                const totalAllFuels = d3.sum(stackedData[stackedData.length - 1], d => d[1] - d[0])
                    + d3.sum(stackedData[stackedData.length - 2], d => d[1] - d[0])
                    + d3.sum(stackedData[stackedData.length - 3], d => d[1] - d[0])
                    + d3.sum(stackedData[stackedData.length - 4], d => d[1] - d[0])
                    + d3.sum(stackedData[stackedData.length - 5], d => d[1] - d[0]);

                const averagePercentage = (total * 100) / totalAllFuels; // Assuming 31 as the total number of years

                const format = d3.format(".2f");

                // Check if d and d.key are defined
                if (d && d.key) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(`
                <strong><h3>${d.key}</h3></strong><br>
                <strong>Fuel Type Total:</strong> ${format(total)} kWh<br>
                <strong>All Fuels Total:</strong> ${format(totalAllFuels)} kWh<br>
                <strong>Percentage usage over 30 years:</strong> ${format(averagePercentage)}%
            `)
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 28) + "px");
                }
            })
            .on("mouseout", function () {
                // Restore the original style on mouseout
                d3.select(this)
                    .style("opacity", 1)
                    .style("stroke", "none");

                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Add axes
        svg.select(".x-axis").remove();
        svg.select(".y-axis").remove();

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        // Add labels
        svg.select(".x-label").remove();
        svg.select(".y-label").remove();

        svg.append("text")
            .attr("class", "x-label")
            .attr("transform", `translate(${width / 2},${height + margin.bottom - 5})`)
            .style("text-anchor", "middle")
            .style("fill", "#fff") // Set text color to white
            .text("Year");

        svg.append("text")
            .attr("class", "y-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - height / 2)
            .attr("dy", "7em")
            .style("text-anchor", "middle")
            .style("fill", "#fff") // Set text color to white
            .text("Energy Consumption (per capita) kWh");

        // Add legend
        const legend = svg.select(".legend").remove();

        const newLegend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width + 20}, 0)`);

        keys.reverse().forEach((key, i) => {
            newLegend.append("rect")
                .attr("x", 0)
                .attr("y", i * 20)
                .attr("width", 10)
                .attr("height", 10)
                .attr("class", `area ${key}`)
                .style("fill", color(key));

            newLegend.append("text")
                .attr("x", 20)
                .attr("y", i * 20 + 9)
                .attr("dy", "0.35em")
                .style("fill", "#fff") // Set text color to white
                .text(key);
        });
    }
});