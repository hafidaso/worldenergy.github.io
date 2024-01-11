// Load the data from the CSV file
d3.csv("data/solar-and-wind-power-generation.csv").then(function(data) {
    // Convert numeric values from strings to numbers
    data.forEach(function(d) {
        d.year = +d.year;
        d.ElectricityFromSolarAndWindTWh = +d.ElectricityFromSolarAndWindTWh;
    });

    // Set the dimensions and margins of the graph
    const margin = {top: 20, right: 80, bottom: 40, left: 70},
          width = 1060 - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    const svg = d3.select("#chart-container")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add X axis
    const x = d3.scaleLinear()
      .domain(d3.extent(data, function(d) { return d.year; }))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    // Add Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return d.ElectricityFromSolarAndWindTWh; })])
      .range([ height, 0 ]);
    svg.append("g")
      .call(d3.axisLeft(y).tickFormat(function(d) { return d + " TWh"; }));

    // Group the data by country
    const sumstat = d3.nest()
      .key(function(d) { return d.country; })
      .entries(data);

    // Color palette
    const color = d3.scaleOrdinal()
      .domain(sumstat.map(function(d){ return d.key }))
      .range(d3.schemeCategory10);
    // Create a tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px");
    

    // Draw the line
    svg.selectAll(".line")
      .data(sumstat)
      .enter()
      .append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", function(d){ return color(d.key) })
        .attr("stroke-width", 2)
        .attr("d", function(d){
            return d3.line()
                .x(function(d) { return x(d.year); })
                .y(function(d) { return y(d.ElectricityFromSolarAndWindTWh); })
                (d.values)
        })
        
        // Add the legend
    const keys = sumstat.map(function(d) { return d.key; });
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + 10}, 0)`);

    keys.forEach((key, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 20)
            .attr("width", 20)
            .attr("height", 10)
            .style("fill", color(key));

        legend.append("text")
            .attr("x", 20)
            .attr("y", i * 20 + 9)
            .attr("dy", "0.35em")
            .style("fill", "#fff") // Set text color to white
            .text(key);
    });
    
    // Tooltip event handlers
    const mouseover = function(event, d) {
        d3.select(this).attr('r', 7); // Increase dot size on hover
        tooltip.style("opacity", 1);
    };

    const mousemove = function(event, d) {
        tooltip.html("Country: " + d.country + "<br>Year: " + d.year + "<br>Electricity: " + d.ElectricityFromSolarAndWindTWh + " TWh")
               .style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 15) + "px");
    };

    const mouseleave = function(event, d) {
        tooltip.style("opacity", 0);
        d3.select(this).attr('r', 5); // Reset the radius back to its original size
    };

    // Add the dots
    svg.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
            .attr("cx", function(d) { return x(d.year); })
            .attr("cy", function(d) { return y(d.ElectricityFromSolarAndWindTWh); })
            .attr("r", 5)
            .attr("fill", "#69b3a2")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);

    // Add country names as labels at the end of each line
    svg.selectAll(".label")
        .data(sumstat)
        .enter()
        .append("text")
            .datum(function(d) { return { key: d.key, value: d.values[d.values.length - 1] }; }) // Get the last value of each country
            .attr("transform", function(d) {
                return `translate(${x(d.value.year)},${y(d.value.ElectricityFromSolarAndWindTWh)})`; 
            })
            .attr("x", 5)  // Move the text a bit to the right of the line end
            .attr("dy", ".35em")  // Align text centrally on the line end
            .style("font", "10px sans-serif")
            .style("fill", function(d) { return color(d.key); })
            .text(function(d) { return d.key; });
});
