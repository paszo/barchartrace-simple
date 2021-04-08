// Data source
const url = 'category-brands.csv';

const width = 960;
const height = 600;

const tickDuration = 250;
const top_n = 12;
const margin = {
  top: 80,
  right: 0,
  bottom: 5,
  left: 20
}

const barPadding = (height-(margin.bottom+margin.top))/(top_n*5);





const svg = d3.select("#chart").append("svg")
    .attr("viewBox", [0, 0, width, height]);

const title = svg.append("text")
    .attr('class', 'title')
    .attr('y', 24)
    .html('18 years of Interbrand’s Top Global Brands');

const subtitle = svg.append("text")
    .attr("class", "subTitle")
    .attr("y", 55)
    .text("Brand value, $m");






d3.csv(url, d3.autoType).then(data => {
  console.log(data);

  // PARSE THE DATA

  // convert date to year
  for(let i = 0; i < data.length; i++){
        data[i].year = data[i].date.getFullYear();
    }

  //  build names dictionary
  const names = Array.from(new Set(data.map(d => d.name)));

  // build years dictionary
  const years = Array.from(new Set(data.map(d => d.year))).sort();

  // set year to first year
  let year = years[0];

  // set last year - needed to stop animation
  const lastYear = years[years.length - 1];

  // build color scale based on categories
  const categories = Array.from(new Set(data.map(d => d.category)));
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
      .domain(categories);

  // BUILD MISSING DATA - with the value = 0

  const dataUpdated = [];

  for (let i = 0; i < names.length; i++){
      for (let j = 0; j < years.length; j++){
         let record = data.find(d => d.name === names[i] && d.year === years[j]);
           if(typeof record !== "undefined") {
               dataUpdated.push({
                 category: record.category,
                   year: years[j],
                   name: names[i],
                   value: record.value,
               })
           } else {
               dataUpdated.push({
                 // category: record.category,
                   year: years[j],
                   name: names[i],
                   value: 0,
               })
        }
      }
   }

  const frames = 10;

  // BIULD KEYFRAMES

  const keyframes = [];

  for(let i = 0; i < names.length; i++){
       let records = dataUpdated.filter(d => d.name === names[i]).sort((a,b) => a.year - b.year);
       // console.log(records);

       let lastValue;

       for(let j = 0; j < records.length - 1; j++){

           let a = records[j];
           let b = records[j+1];
           if(j === 0){
               lastValue = a.value;
           }


           for(let k = 0; k < frames; k++){
               keyframes.push({
                 colour: colorScale(a.category),
                 name: names[i],
                   year: Math.round((a.year * (frames - k)/frames + b.year * (k/frames))*100)/100,
                   value: Math.round(a.value * (frames - k)/frames + b.value * (k/frames)),
                   lastValue: lastValue
               })
               lastValue = Math.round(a.value * (frames - k)/frames + b.value * (k/frames));
           }
       }

       // add last keyframe
       let lastRecord = records[records.length - 1];

        keyframes.push({
          colour: colorScale(lastRecord.category),
            name: lastRecord.name,
            year: lastRecord.year,
            value: lastRecord.value,
            lastValue: lastValue
        })
   }

  // substitute data with keyframes

  data = keyframes;

  // prepare the Year Slice
  let yearSlice = data.filter(d => d.year === year)
      .sort((a,b) => b.value - a.value)
      .slice(0, top_n);

  yearSlice.forEach((d,i) => d.rank = i);

  let x = d3.scaleLinear()
      .domain([0, d3.max(yearSlice, d => d.value)])
      .range([margin.left, width-margin.right-65]);

  let y = d3.scaleLinear()
      .domain([top_n, 0])
      .range([height-margin.bottom, margin.top])

    let xAxis = d3.axisTop()
        .scale(x)
        .ticks(width > 500 ? 5: 2)
        .tickSize(-(height-margin.top-margin.bottom))
        .tickFormat(d => d3.format(',')(d));

  svg.append("g")
      .attr("class", "axis xAxis")
      .attr("transform", `translate(0, ${margin.top})`)
      .call(xAxis)
      .selectAll('.tick line')
      .classed('origin', d => d === 0);

  svg.selectAll('rect.bar')
      .data(yearSlice, d => d.name)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', x(0)+1)
      .attr('width', d => x(d.value)-x(0)-1)
      .attr('y', d => y(d.rank)+5)
      .attr('height', y(1)-y(0)-barPadding)
      // .attr('height', y.)
      .style('fill', d => d.colour)

    svg.selectAll('text.label')
        .data(yearSlice, d => d.name)
        .enter()
        .append('text')
        .attr('class', 'label')
        .attr('x', d => x(d.value)-8)
        .attr('y', d => y(d.rank) + (y(1) - y(0) - barPadding)/2)
        .attr('alignment-baseline', 'hanging')
        .style('text-anchor', 'end')
        .text(d => d.name)










})