function drawGrossRevenueChart(dataset) {

     //Get data
     let aggrData = dataWrangleTotalByType(dataset);


    const lineTypes = [
      {'legend_name': 'Total Gross Sales', 'variable_name': 'totalGross'},
      {'legend_name': 'Advance Sale Gross', 'variable_name': 'advance_sale_total'},
      {'legend_name': 'Last Minute Sale Gross', 'variable_name': 'last_minute_sale_total'}
    ]

    const filterDataByType = ((week, sale_type) => (
      {
          'show_week': week.show_week,
          'gross_sales': week[sale_type],
          'advance_sale_percent': week.advance_sale_percent,
          'last_minute_sale_percent': week.last_minute_sale_percent
      }
    ))

    const aggrDataByType = lineTypes.map(line_type => (
      {
        ...line_type,
        'data': aggrData.map(week => filterDataByType(week, sale_type=line_type.variable_name))
      }
    ))

    //Accessor functions
    const xAccessor = d => d.show_week

    //Y accessor functions
    const yAccessor = d => d.gross_sales

    const asAccessor = d => d.advance_sale_percent
    const lmsAccessor = d => d.last_minute_sale_percent

    //Create chart dimensions
    let dimensions = {
      width: 1000,
      height: 500,
      margin: {
        top: 60,
        right: 15,
        bottom: 100,
        left: 150,
      },
    }
    dimensions.boundedWidth = dimensions.width
      - dimensions.margin.left
      - dimensions.margin.right
    dimensions.boundedHeight = dimensions.height
      - dimensions.margin.top
      - dimensions.margin.bottom

    //Draw canvas

    const wrapper = d3.select("#grossRevChart")
      .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)

    const bounds = wrapper.append("g")
        .style("transform", `translate(${
          dimensions.margin.left
        }px, ${
          dimensions.margin.top
        }px)`);



    //Create scales

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(aggrData.map(week => week.totalGross))])
      .range([dimensions.boundedHeight, 0])


    const xScale = d3.scaleLinear()
      .domain(d3.extent(aggrData.map(week => week.show_week)))
      .range([0, dimensions.boundedWidth])

    const colorScale = d3.scaleOrdinal()
           .domain(lineTypes.map(x => x.legend_name))
           .range(['#008080', '#FFC20A', '#0C7BDC']);

   // Add the lines
   const lineGenerator = d3.line()
   .curve(d3.curveCardinal)
   .x(d => xScale(xAccessor(d)))
   .y(d => yScale(yAccessor(d)))

  bounds.selectAll("chartLines")
   .data(aggrDataByType)
   .enter()
   .append("path")
     .attr("class", d => d.variable_name )
     .attr("d", d => lineGenerator(d.data))
     .style("stroke-width", 4)
     .style("fill", "none")
     .attr("stroke", d => colorScale(d.legend_name))

  const changeOpacity = (d => {
    currentOpacity = d3.selectAll("." + d.variable_name).style("opacity")
    // Change the opacity: from 0 to 1 or from 1 to 0
    d3.selectAll("." + d.variable_name).transition().style("opacity", currentOpacity == 1 ? 0:1)
  })

  //Legends
  wrapper
      .selectAll("chartLegend")
      .data(aggrDataByType)
      .enter()
      .append('g')
      .append("text")
      .attr('x', (d,i) => 300 + i*200)
      .attr('y', 20)
      .text(d => d.legend_name)
      .style("fill", d => colorScale(d.legend_name))
      .style("font-size", 15)
      .on("click", (event, d) => changeOpacity(d))

    //Draw peripherals

    const yAxisGenerator = d3.axisLeft(yScale)
      .ticks(10, ",f")
      .tickSize(-dimensions.width)

    const yAxis = bounds.append("g")
      .attr("class", "axis y-axis")
      .call(yAxisGenerator)

    const xAxisGenerator = d3.axisBottom(xScale)
        .ticks(12)

    const xAxis = bounds.append("g")
      .attr("class", "axis x-axis")
      .call(xAxisGenerator)
        .style("transform", `translateY(${
          dimensions.boundedHeight
        }px)`)

    //add axis labels
    bounds
      .append('g')
      .style("transform", `translate(${
        -100
      }px, ${
        dimensions.boundedHeight/2
      }px)`)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .text('Revenue($)');


    bounds.append("text")
        .style("transform", `translate(${
            dimensions.boundedWidth/2
        }px, ${
          dimensions.boundedHeight + dimensions.margin.top
       }px)`)
      .attr("text-anchor", "middle")
      .text("Show Week");

    //Interactions


    const listeningRect = bounds
    .selectAll("tooltip")
    .data(aggrDataByType)
    .enter()
      .append("rect")
      .attr("class", "listening-rect")
      .attr("width", dimensions.boundedWidth)
      .attr("height", dimensions.boundedHeight)
      .on("mousemove", (event, d) => onMouseMove(event, d.data))
      .on("mouseleave", onMouseLeave)


    const tooltip = d3.select("#tooltip")

    function onMouseMove(e, data) {

      const mousePosition = d3.pointer(e)
      const hoveredShow = xScale.invert(mousePosition[0])

      const getDistanceFromHoveredShow = d => Math.abs(xAccessor(d) - hoveredShow)

      const closestIndex = d3.leastIndex(data, (a, b) => (
          getDistanceFromHoveredShow(a) - getDistanceFromHoveredShow(b)
      ))
      const closestDataPoint = data[closestIndex]

      const closestXValue = xAccessor(closestDataPoint)
      const closestYValue = yAccessor(closestDataPoint)
      const closestASValue = asAccessor(closestDataPoint)
      const closestLMSValue = lmsAccessor(closestDataPoint)

      tooltip.select("#show")
            .text(closestXValue)

      const formatRevenue = d => `$ ${d3.format(",.0f")(d)}`

      const formatPercRevenue = d => `${d3.format(",.0f")(d)}%`

      tooltip.select("#adv-sale")
        .html(formatPercRevenue(closestASValue))

      tooltip.select("#last-minute-sale")
        .html(formatPercRevenue(closestLMSValue))

      const x = xScale(closestXValue)
              + dimensions.margin.left
      const y = yScale(closestYValue)
              + dimensions.margin.top

      tooltip.style("transform", `translate(`
              + `calc( -50% + ${x}px),`
              + `calc(-100% + ${y}px)`
              + `)`)

      tooltip.style("opacity", 1)

      }


      function onMouseLeave() {
          tooltip.style("opacity", 0)
      }

  }



  function drawPercRevenueChart(dataset) {

    //Get data
    const aggrDataBySaleType00 = createDatasetBySliderSaleType(dataset, 0);
    const aggrDataBySaleType01 = createDatasetBySliderSaleType(dataset, 1);
    const aggrDataBySaleType02 = createDatasetBySliderSaleType(dataset, 2);

    const revenuePercByBucket = [{"bucket": "Last Minute Sale: 0 weeks out Adv Sale: 1+ weeks out", "data": aggrDataBySaleType00},
                                {"bucket": "Last Minute Sale: 0-1 weeks out Adv Sale: 2+ weeks out", "data": aggrDataBySaleType01},
                                {"bucket": "Last Minute Sale: 0-2 weeks out Adv Sale: 3+ weeks out", "data": aggrDataBySaleType02},
                              ]


    //Add the buttons
    const bucketButtons = d3.select("#bucketButtons")
        .selectAll(".buttons")
        .data(revenuePercByBucket)
        .enter().append("button")
        .text(d =>  d.bucket)
        .attr("class", "button is-small saletype")
        .on("click", function(e, d) { updateChart(d.data); })

   //Accessor functions
   const xAccessor = d => d.show_week
   const yAccessor = d => d.perc_gross_by_type

   //Create chart dimensions
   let dimensions = {
    width: 1000,
    height: 500,
    margin: {
      top: 60,
      right: 15,
      bottom: 100,
      left: 150,
    },
  }
   dimensions.boundedWidth = dimensions.width
     - dimensions.margin.left
     - dimensions.margin.right
   dimensions.boundedHeight = dimensions.height
     - dimensions.margin.top
     - dimensions.margin.bottom

   //Draw canvas

   const wrapper = d3.select("#percRevChart")
     .append("svg")
       .attr("width", dimensions.width)
       .attr("height", dimensions.height)

   const bounds = wrapper.append("g")
       .style("transform", `translate(${
         dimensions.margin.left
       }px, ${
         dimensions.margin.top
       }px)`);


    //Create scales
    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([dimensions.boundedHeight, 0])

    const xScale = d3.scaleLinear()
        .domain(d3.extent(aggrDataBySaleType01.map(week => week.show_week)))
        .range([0, dimensions.boundedWidth])

    const colorScale = d3.scaleOrdinal()
        .domain(aggrDataBySaleType01.map(d => d.ticket_sale_type))
        .range(['#FFC20A', '#0C7BDC']);

  // Add the lines
  const lineGenerator = d3.line()
  .curve(d3.curveCardinal)
  .x(d => xScale(xAccessor(d)))
  .y(d => yScale(yAccessor(d)))


  const ticketGroup = d3.group(aggrDataBySaleType01, d => d.ticket_sale_type)

   let bucketGroup = bounds.append("g").selectAll(".team-group")
      .data(ticketGroup)
      .enter()
      .append("g")
      .attr("class", "team-group");

      bucketGroup.append("path")
      .attr("class", "type-line")
      .attr('fill', 'none')
      .attr('stroke-width', 4)
      .attr('stroke', d => colorScale(d[0]))
      .attr("d", d => lineGenerator(d[1]));


    function updateChart(dataset) {

        const ticketGroup = d3.group(dataset, d => d.ticket_sale_type)

        bucketGroup
            .data(ticketGroup);

        bucketGroup.select("path")
          .attr("d", d => lineGenerator(d[1]));

      }


   //Draw peripherals

   const yAxisGenerator = d3.axisLeft(yScale)
     .ticks(10, ",f")
     .tickSize(-dimensions.width)

   const yAxis = bounds.append("g")
     .attr("class", "axis y-axis")
     .call(yAxisGenerator)

   const xAxisGenerator = d3.axisBottom(xScale)
       .ticks(12)

   const xAxis = bounds.append("g")
     .attr("class", "axis x-axis")
     .call(xAxisGenerator)
       .style("transform", `translateY(${
         dimensions.boundedHeight
       }px)`)



    //Add axis labels
    bounds
      .append('g')
      .style("transform", `translate(${
        -100
      }px, ${
        dimensions.boundedHeight/2
      }px)`)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .text('% of Total Revenue, by Purchase Type');


    bounds.append("text")
        .style("transform", `translate(${
            dimensions.boundedWidth/2
        }px, ${
          dimensions.boundedHeight + dimensions.margin.top
       }px)`)
      .attr("text-anchor", "middle")
      .text("Show Week");

    //Add legends
    wrapper
      .selectAll("chartLegend")
      .data(ticketGroup)
      .enter()
      .append('g')
      .append("text")
      .attr('x', (d,i) => 450 + i*150)
      .attr('y', 20)
      .text(d => d[0])
      .style("fill", d => colorScale(d[0]))
      .style("font-size", 15)

  }

  //Data wrangling functions

  function dataWrangleGrossTotal(dataset) {

    //Get gross total by show week

    let aggValueHolder = {};

    dataset.forEach((d) => {
        aggValueHolder.hasOwnProperty(d.show_week) ? aggValueHolder[d.show_week] +=  d.gross :  aggValueHolder[d.show_week] = d.gross;
    });


    let aggrData = [];

    for (let [key, value] of Object.entries(aggValueHolder)) {
        aggrData.push({ show_week: +key, totalGross: value });
    }

    return aggrData;

}


function dataWrangleTotalByType(dataset) {

    const aggrDataBySaleType = createDatasetBySliderSaleType(dataset);

    //reshape "long to wide", in data science terms
    const advanceSalesOnly = aggrDataBySaleType
      .filter(sale => sale.ticket_sale_type === "Advance Sale")
      .map(sale => ({"show_week": sale.show_week, "advance_sale_percent": sale.perc_gross_by_type, "advance_sale_total": sale.grossByPurchaseType}))

    let lastMinuteSales = aggrDataBySaleType
      .filter(sale => sale.ticket_sale_type === 'Last Minute Sale')
      .map(sale => ({"show_week": sale.show_week, "last_minute_sale_percent": sale.perc_gross_by_type, "totalGross": sale.totalGross, "last_minute_sale_total": sale.grossByPurchaseType}))

    lastMinuteSales.forEach((last_min) => {
        const advanceSale = advanceSalesOnly.filter(advance => advance.show_week === last_min.show_week)[0];
        last_min.advance_sale_percent = advanceSale.advance_sale_percent;
        last_min.advance_sale_total = advanceSale.advance_sale_total;
    });

    return lastMinuteSales;

}


function createDatasetBySliderSaleType(dataset, typeMarker = 1) {

  //Get gross total by sale week
  let aggrData = dataWrangleGrossTotal(dataset);

  //Create ticket sale type variable
  dataset.forEach((d) => {

      d["ticket_sale_type"] =  d.show_week - d.sale_week <= typeMarker ? "Last Minute Sale" : "Advance Sale";

  });

 //Get % of gross total by show week and sale type

 let aggByTypevalueHolder = {};

  dataset.forEach((d) => {
      aggByTypevalueHolder
        .hasOwnProperty(d.show_week + "-" + d.ticket_sale_type) ? aggByTypevalueHolder[d.show_week + "-" + d.ticket_sale_type] +=  d.gross :  aggByTypevalueHolder[d.show_week + "-" + d.ticket_sale_type] = d.gross;
  });

 let aggrDataBySaleType = [];

  for (let [key, value] of Object.entries(aggByTypevalueHolder)) {
      aggrDataBySaleType.push({ show_week: +key.split("-")[0],
                      ticket_sale_type: key.split("-")[1],
                      grossByPurchaseType: value });
  }


  //Join in gross total by show
  aggrDataBySaleType.forEach((sale) => {
    const perShow = aggrData.filter((aggrSale) => aggrSale.show_week === sale.show_week)[0];
    sale.totalGross = perShow.totalGross;
  });

  //Calculate % of gross by type
  aggrDataBySaleType.forEach((d) => {
      d["perc_gross_by_type"] =   Math.round((d.grossByPurchaseType/d.totalGross) * 100);
  });

  return aggrDataBySaleType;

}

function assembleCharts() {

    async function getData() {

        const allDataset = await d3.json("javascript_wrangling.json")

        const dataset = allDataset.filter(sale => sale.show_week <= 12);

        return dataset;

    }

    getData().then((dataset) => {
        drawGrossRevenueChart(dataset)
        drawPercRevenueChart(dataset);

    }).catch((err)=> console.log("Error loading data: ", err))

}

assembleCharts();
