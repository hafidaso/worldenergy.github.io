let mainYear = 2018;

Promise.all([
    fetch("data/ne_110m_admin_0_countries.geojson").then((res) => res.json()),
    d3.csv("data/world_clean_dataset.csv"),
]).then(([countries, energyData]) => {
    console.log("Initial_countries:", energyData);

    const initialYearData = energyData.filter((d) => d.year == mainYear);
    console.log(initialYearData);

    // Get unique years from the data
    const uniqueYears = Array.from(new Set(energyData.map((d) => +d.year)));

    // Populate the dropdown with years
    const yearDropdown = d3.select("#yearDropdown");
    yearDropdown
        .selectAll("option")
        .data(uniqueYears)
        .enter()
        .append("option")
        .text((d) => d)
        .attr("value", (d) => d);
    yearDropdown.property("value", mainYear);

    // Add an event listener to the dropdown
    yearDropdown.on("change", function () {
        const selectedYear = +this.value;
        mainYear = selectedYear;
        updateGlobeVisualization(selectedYear);
    });

    function updateGlobeVisualization(selectedYear) {
        console.log("Called:", selectedYear);

        // Clear the previous legend content
        d3.select("#legend").html("");

        const filteredEnergyData = energyData.filter(
            (d) => d.year == selectedYear
        );

        console.log("Check:", filteredEnergyData);

        // Map to store energy data by country
        const energyDataMap = {};
        filteredEnergyData.forEach((d) => {
            energyDataMap[d.country] = d;
        });

        // Prepare for GDP color scaling
        const gdpValues = filteredEnergyData
            .map((d) => +d.gdp)
            .filter(Boolean);
        const maxGDP = Math.max(...gdpValues);
        const minGDP = Math.min(...gdpValues);

        // Define a logarithmic color scale (can switch to linear if preferred)
        const colorScale = d3
            .scaleSequential(d3.interpolateOranges)
            .domain([Math.log(minGDP), Math.log(maxGDP)]);

        countries.features.forEach((feat) => {
            const countryEnergyData =
                energyDataMap[feat.properties.ADMIN] || {};
            feat.properties.energyData = countryEnergyData;
        });

        // Create a legend
        const legend = d3
            .select("#legend")
            .append("svg")
            .attr("width", 700)
            .attr("height", 50)
            .append("g")
            .attr("transform", "translate(10,0)");

        // Add gradient to legend
        legend
            .append("defs")
            .append("linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%")
            .selectAll("stop")
            .data(colorScale.ticks(10).map((t, i, n) => ({ offset: `${(i * 100) / n.length}%`, color: colorScale(t) })))
            .enter()
            .append("stop")
            .attr("offset", (d) => d.offset)
            .attr("stop-color", (d) => d.color);

        // Add a rectangle to the legend
        legend
            .append("rect")
            .attr("width", 180)
            .attr("height", 10)
            .style("fill", "url(#gradient)")
            .style("font-size", "12px");

        // Add legend axis
        const legendScale = d3.scaleLinear().range([0, 180]).domain([minGDP, maxGDP]);
        const legendAxis = d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format(".2s"));

        legend
            .append("g")
            .attr("transform", "translate(0,10)")
            .call(legendAxis);

        // Update the legend when the globe is updated
        function updateLegend() {
            // Update legend axis
            legend.select("g").call(legendAxis);
        }

        const upDatedworld = Globe()
            .globeImageUrl(
                "https://unpkg.com/three-globe/example/img/earth-night.jpg"
            )
            .backgroundImageUrl(
                "https://unpkg.com/three-globe@2.30.0/example/img/night-sky.png"
            )
            .lineHoverPrecision(0)
            .polygonsData(
                countries.features.filter((d) => d.properties.ISO_A2 !== "AQ")
            )
            .polygonAltitude(0.06)
            .polygonSideColor(() => "rgba(0, 100, 0, 0.15)")
            .polygonStrokeColor(() => "#111")
            .polygonsTransitionDuration(300);

        // Set default x-axis scroll to 50% after a short delay
        setTimeout(() => {
            const globeVizElement = document.getElementById("globeViz");
            const defaultXScroll = (globeVizElement.scrollWidth - globeVizElement.clientWidth) / 2;
            globeVizElement.scrollLeft = defaultXScroll;
        }, 100);

        upDatedworld
            .polygonCapColor((feat) => {
                const gdpValue = feat.properties.energyData.gdp || 0;
                return gdpValue > 0 ? colorScale(Math.log(gdpValue)) : "#cefad0";
            })
            .polygonLabel(({ properties: d }) => {
                const energyData = d.energyData || {};

                // Calculate total energy consumption in kWh
                const totalEnergyConsumption =
                    (parseFloat(energyData.coal_cons_per_capita) || 0) +
                    (parseFloat(energyData.gas_energy_per_capita) || 0) +
                    (parseFloat(energyData.hydro_elec_per_capita) || 0) +
                    (parseFloat(energyData.low_carbon_energy_per_capita) || 0) +
                    (parseFloat(energyData.oil_energy_per_capita) || 0) +
                    (parseFloat(energyData.renewables_energy_per_capita) || 0);

                // Ensure totalEnergyConsumption is not zero to avoid division by zero
                if (totalEnergyConsumption === 0) {
                    return `No energy consumption data available for ${d.ADMIN}`;
                }

                // Calculate percentages for each energy source
                const coalPercentage = ((parseFloat(energyData.coal_cons_per_capita) || 0) / totalEnergyConsumption) * 100;
                const gasPercentage = ((parseFloat(energyData.gas_energy_per_capita) || 0) / totalEnergyConsumption) * 100;
                const hydroPercentage = ((parseFloat(energyData.hydro_elec_per_capita) || 0) / totalEnergyConsumption) * 100;
                const lowCarbonPercentage = ((parseFloat(energyData.low_carbon_energy_per_capita) || 0) / totalEnergyConsumption) * 100;
                const oilPercentage = ((parseFloat(energyData.oil_energy_per_capita) || 0) / totalEnergyConsumption) * 100;
                const renewablesPercentage = ((parseFloat(energyData.renewables_energy_per_capita) || 0) / totalEnergyConsumption) * 100;

                return `
    <div class="tooltip">
      <b>${d.ADMIN} (${d.ISO_A2}):</b> <br />
      Population: <i>${(energyData.population / 1e6).toLocaleString(
                    undefined,
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }
                )} million<br/>
      GDP: <i>${(energyData.gdp / 1e12).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })} trillion USD</i><br/>
      Coal: <i>${energyData.coal_cons_per_capita || 'N/A'} kWh (${coalPercentage.toFixed(2)}%)</i><br/>
      Gas: <i>${energyData.gas_energy_per_capita || 'N/A'} kWh (${gasPercentage.toFixed(2)}%)</i><br/>
      Hydro Electricity: <i>${energyData.hydro_elec_per_capita || 'N/A'} kWh (${hydroPercentage.toFixed(2)}%)</i><br/>
      Low Carbon : <i>${energyData.low_carbon_energy_per_capita || 'N/A'} kWh (${lowCarbonPercentage.toFixed(2)}%)</i><br/>
      Oil: <i>${energyData.oil_energy_per_capita || 'N/A'} kWh (${oilPercentage.toFixed(2)}%)</i><br/>
      Renewables: <i>${energyData.renewables_energy_per_capita || 'N/A'} kWh (${renewablesPercentage.toFixed(2)}%)</i><br/>
    </div>
  `;
            })

            .onPolygonHover((hoverD) => {
                upDatedworld.polygonsData().forEach((d) => {
                    if (
                        hoverD &&
                        d === hoverD &&
                        hoverD.properties.energyData &&
                        hoverD.properties.energyData.gdp !== undefined
                    ) {
                        // When hovering over a country with defined GDP
                        d.properties.__highlighted = true;
                    } else {
                        // Reset other countries or countries with undefined GDP
                        d.properties.__highlighted = false;
                    }
                });

                upDatedworld
                    .polygonAltitude((d) =>
                        d.properties.__highlighted ? 0.6 : 0.06
                    )
                    .polygonCapColor((d) => {
                        if (d.properties.__highlighted) {
                            return "#FA8072"; // Color for highlighted country
                        }
                        const gdpValue = d.properties.energyData
                            ? d.properties.energyData.gdp
                            : 0;
                        return gdpValue > 0
                            ? colorScale(Math.log(gdpValue))
                            : "#cefad0";
                    });

                upDatedworld.onPolygonClick((clickedCountry) => {
                    if (
                        clickedCountry &&
                        clickedCountry.properties &&
                        clickedCountry.properties.energyData
                    ) {
                        const countryName = encodeURIComponent(
                            clickedCountry.properties.ADMIN
                        );
                        const selectedYear = mainYear; // You may want to use the current selected year or obtain it from elsewhere

                        // Construct a query string with necessary parameters
                        const queryString = `country=${countryName}&year=${selectedYear}`;

                        // Redirect to pareto.html with the constructed query string
                        window.location.href = `Energy.html?${queryString}`;
                    }
                });
            });

        // Set default x-axis scroll to 50%
        const globeVizElement = document.getElementById("globeViz");
        const defaultXScroll = (globeVizElement.scrollWidth - globeVizElement.clientWidth) / 2;
        globeVizElement.scrollLeft = defaultXScroll;

        upDatedworld(document.getElementById("globeViz"));
        updateLegend();
    }

    updateGlobeVisualization(mainYear);
});
document.getElementById('comment-form').addEventListener('submit', function(e) {
    e.preventDefault();

    var name = document.getElementById('comment-name').value;
    var message = document.getElementById('comment-message').value;

    var commentList = document.getElementById('comments-list');
    var newComment = document.createElement('li');
    newComment.textContent = `Name: ${name}, Comment: ${message}`;
    commentList.appendChild(newComment);
    
    // Reset the form
    this.reset();
});

