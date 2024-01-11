// Load the data from the JSON file
d3.json("data/world_clean_dataset.json").then(function (data) {
    // Convert string values to numbers
    data.forEach(function (d) {
        d.year = +d.year;
        d.gdp = +d.gdp;
        // d.primary_energy_consumption = +d.primary_energy_consumption;
    });

    // Get unique country names
    const countries = Array.from(new Set(data.map(d => d.country)));

    // After populating the select element with country options
    console.log("Dropdown Options:", countries);

    // Define a mapping for consumption types
    const consumptionTypeMapping = {
        "primary_energy_consumption": "Primary Energy Consumption",
        "coal_cons_per_capita": "Coal Consumption per Capita",
        "gas_energy_per_capita": "Gas Energy Consumption per Capita",
        "hydro_elec_per_capita": "Hydroelectric Energy Consumption per Capita",
        "low_carbon_energy_per_capita": "Low Carbon Energy Consumption per Capita",
        "oil_energy_per_capita": "Oil Energy Consumption per Capita",
        "renewables_energy_per_capita": "Renewables Energy Consumption per Capita"
    };

    // Reverse mapping for line chart processing
    const consumptionTypeInternalMapping = Object.fromEntries(
        Object.entries(consumptionTypeMapping).map(([key, value]) => [value, key])
    );

    // Use the mapped names for dropdown options
    const consumptionSelect = Object.values(consumptionTypeMapping);


    // After populating the consumption type select element
    console.log("Consumption Type Options:", consumptionSelect);


    // Populate the select element with country options
    const select = d3.select("#countrySelect")
        .selectAll("option")
        .data(countries)
        .enter()
        .append("option")
        .text(d => d);

    // Populate the consumption type select element
    const consumptionSelectElement = d3.select("#consumptionSelect")
        .selectAll("option")
        .data(consumptionSelect)
        .enter()
        .append("option")
        .text(d => d);

    // Set up the chart dimensions
    const margin = { top: 30, right: 100, bottom: 70, left: 150 };
    const width = 1200 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create color scale for bars and line
    const colorScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.primary_energy_consumption)])
        .range(['lightblue', 'steelblue']); // Adjust colors as needed

    // Create SVG element
    const svg = d3.select("body")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    // Function to update the chart based on the selected country
    function updateChart(selectedCountry, selectedType) {
        // Remove existing chart elements including x-axis and y-axis
        svg.selectAll(".bar-gdp, .line-energy, .dot, .axis-bottom, .axis-left, .axis-right").remove();

        console.log("Updating chart for:", selectedCountry, "with consumption type:", selectedType);

        const filteredData = data.filter(d => d.country === selectedCountry);

        console.log("Filtered Data:", filteredData);

        // Create x and y scales (initial scales for all data)
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.year))
            .range([0, width])
            .padding(0.1)
            .paddingOuter(0.2);  // Add padding to the outer edges

        const yScaleGDP = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.gdp)])
            .range([height, 0]);


        // Create color scale for bars and line dynamically based on the selected consumption type
        const colorScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => +d[selectedType])])
            .range(['lightblue', 'steelblue']); // Adjust colors as needed

        const yScaleEnergy = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d[selectedType])])
            .range([height, 0]);

        // Create x and y axes
        const xAxis = d3.axisBottom(xScale);
        const yAxisGDP = d3.axisLeft(yScaleGDP);
        const yAxisEnergy = d3.axisRight(yScaleEnergy);

        // Draw x axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .attr("class", "axis-bottom"); // Add a class for styling

        /// Draw y axis for GDP (left)
        svg.append("g")
            .call(yAxisGDP)
            .attr("class", "axis-left")
            .selectAll(".tick text")
            .style("text-anchor", "end")
            .attr("dy", -1) // Adjust the vertical position of tick labels
            .attr("dx", -4); // Adjust the horizontal position of tick labels


        // Draw y axis for energy consumption (right)
        svg.append("g")
            .attr("transform", "translate(" + width + ", 0)")
            .call(yAxisEnergy)
            .attr("class", "axis-right"); // Add a class for styling

        // Update x and y scales for the filtered data
        xScale.domain(filteredData.map(d => d.year));
        yScaleGDP.domain([0, d3.max(filteredData, d => d.gdp)]);
        yScaleEnergy.domain([0, d3.max(filteredData, d => +d[selectedType])]);


        console.log("X Scale Domain:", xScale.domain());
        console.log("Y Scale GDP Domain:", yScaleGDP.domain());
        console.log("Y Scale Energy Domain:", yScaleEnergy.domain());

        // Update x and y axes with transitions
        svg.select(".axis-bottom")
            .transition()
            .duration(500)
            .call(xAxis);

        svg.select(".axis-left")
            .transition()
            .duration(500)
            .call(yAxisGDP);

        svg.select(".axis-right")
            .transition()
            .duration(500)
            .call(yAxisEnergy);

        // Draw bars for GDP with color grading and tooltip
        const bars = svg.selectAll(".bar-gdp")
            .data(filteredData)
            .enter().append("rect")
            .attr("class", "bar-gdp")
            .attr("x", d => xScale(d.year))
            .attr("y", height) // Start the bars at the bottom of the chart
            .attr("width", xScale.bandwidth())
            .attr("height", 0) // Set initial height to 0
            // .style("fill", d => colorScale(d[selectedType]))
            .on("mouseover", function (event, d) {
                const tooltipData = filteredData[d];

                // Format GDP with units (e.g., in trillions)
                const formattedGDP = (+tooltipData.gdp / 1e12).toLocaleString() + " T";

                // change unit dynamically based on the selected consumption type
                let unit = " kWh";

                // Check if the selectedType is 'primary_energy_consumption'
                if (selectedType === 'primary_energy_consumption') {
                    unit = " TWh";
                }

                // Increase size on mouseover
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("height", d => height - yScaleGDP(d.gdp) + 10) // Increase height by 5 pixels
                    .attr("y", d => yScaleGDP(d.gdp) - 5); // Move the bar up by 5 pixels

                // Change color on mouseover
                d3.select(this).style("fill", "lightcoral");

                // Show tooltip on mouseover
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(
                    "GDP: $ " + formattedGDP +
                    "<br>Year: " + tooltipData.year
                )
                    .style("left", (event.pageX + 10) + "px") // Adjust position relative to cursor
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", function (event, d) {
                // Update the position of the tooltip with the mouse movement
                const [x, y] = d3.mouse(this.parentNode);
                tooltip.style("left", (x + 100) + "px")
                    .style("top", (y + 250) + "px");
            })
            .on("mouseout", function (d) {
                // Revert size on mouseout
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("height", d => height - yScaleGDP(d.gdp))
                    .attr("y", d => yScaleGDP(d.gdp));

                // Change color back on mouseout
                d3.select(this).style("fill", d => colorScale('steelblue'));

                // Hide tooltip on mouseout
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .transition() // Add a transition for a smoother update
            .duration(500) // Set the duration of the transition
            .attr("y", d => yScaleGDP(d.gdp))
            .attr("height", d => height - yScaleGDP(d.gdp));

        // Draw line for energy consumption with color grading
        const line = d3.line()
            .x(d => xScale(d.year) + xScale.bandwidth() / 2)
            .y(d => yScaleEnergy(+d[selectedType]));

        svg.append("path")
            .data([filteredData])
            .attr("class", "line-energy")
            .attr("d", line)
            .style("stroke-width", 2)  // Set the stroke width to 2 pixels
            .style("stroke", "orange");  // Set the stroke color to black

        // Draw dots on the line chart
        svg.selectAll(".dot")
            .data(filteredData)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(d.year) + xScale.bandwidth() / 2)
            .attr("cy", d => yScaleEnergy(+d[selectedType]))
            .attr("r", 5)
            .style("fill", "red")
            .on("mouseover", function (event, d) {
                const tooltipData = filteredData[d];

                // Format GDP with units (e.g., in trillions)
                const formattedGDP = (+tooltipData.gdp / 1e12).toLocaleString() + " T";

                // change unit dynamically based on the selected consumption type
                let unit = " kWh";

                // Check if the selectedType is 'primary_energy_consumption'
                if (selectedType === 'primary_energy_consumption') {
                    unit = " TWh";
                }

                // Change color on mouseover
                d3.select(this).style("fill", "blue");

                // Increase size on mouseover
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 7); // Increase radius by 2 pixels

                // Show tooltip on mouseover
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(
                    "Energy Consumption: " + (+tooltipData[selectedType]).toLocaleString() + unit +
                    "<br>Year: " + tooltipData.year
                )
                    .style("left", (event.pageX + 10) + "px") // Adjust position relative to cursor
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", function (event, d) {
                // Update the position of the tooltip with the mouse movement
                const [x, y] = d3.mouse(this.parentNode);
                tooltip.style("left", (x + 100) + "px")
                    .style("top", (y + 250) + "px");
            })
            .on("mouseout", function (d) {
                // Revert color and size on mouseout
                d3.select(this).style("fill", "red");

                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 5); // Revert radius to the original value

                // Hide tooltip on mouseout
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })


        console.log("Chart updated!");
    }

    // Initial update with the first country and consumption type in the list
    updateChart(countries[0], consumptionTypeInternalMapping[consumptionSelect[0]]);

    // Add event listeners to update the chart when the user selects a different country or consumption type
    d3.select("#countrySelect").on("change", function () {
        const selectedCountry = d3.select(this).property("value");
        const selectedTypeDisplay = d3.select("#consumptionSelect").property("value");
        const selectedTypeInternal = consumptionTypeInternalMapping[selectedTypeDisplay];
        updateChart(selectedCountry, selectedTypeInternal);
    });

    // Create a tooltip div
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Add a title to the chart
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "22px")
        .style("fill", "#fff") // Set text color to white
        .style("font-weight", "bold") // Set font weight to bold
        .text("GDP vs Energy Consumption");

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#fff") // Set text color to white
        .style("font-weight", "bold") // Set font weight to bold
        .text("Year");

    // Add y-axis label for GDP (left)
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -100)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#fff") // Set text color to white
        .style("font-weight", "bold") // Set font weight to bold
        .text("GDP");

    // Add y-axis label for energy consumption (right)
    const yAxisEnergyLabel = svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", width + 60)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#fff") // Set text color to white
        .style("font-weight", "bold") // Set font weight to bold
        .text("Energy Consumption (in TWh)");

    // Function to update y-axis label
    function updateYAxisLabel(selectedType) {
        let unit = "kWh";

        // Check if the selectedType is 'primary_energy_consumption'
        if (selectedType === 'Primary Energy Consumption') {
            unit = "TWh";
        }

        yAxisEnergyLabel.text(`${selectedType} (in ${unit})`);
    }


    // Initial update with the first consumption type in the list
    updateYAxisLabel(consumptionSelect[0]);

    d3.select("#consumptionSelect").on("change", function () {
        const selectedTypeDisplay = d3.select(this).property("value");
        const selectedTypeInternal = consumptionTypeInternalMapping[selectedTypeDisplay];
        const selectedCountry = d3.select("#countrySelect").property("value");
        updateChart(selectedCountry, selectedTypeInternal);
        updateYAxisLabel(selectedTypeDisplay)
    });
});
