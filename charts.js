const renderTable = ({ data, dataName = 'PAR.csv' }) => {
  const tableBody = document.getElementById('table-body');
  const tableHead = document.getElementById('table-head');

  tableBody.innerHTML = '';
  tableHead.innerHTML = '';

  const sortedDataAverage = data[0].averageSolar
    ? data
        .map((d) => {
          return {
            month: d.month,
            solar: d.averageSolar,
            colorNumber: 0,
          };
        })
        .sort((a, b) => b.solar - a.solar)
    : data
        .map((d) => {
          return {
            month: d.month,
            par: d.averagePar,
            colorNumber: 0,
          };
        })
        .sort((a, b) => b.par - a.par);

  sortedDataAverage.forEach((d, index) => {
    // pick the color value from the array based on the length of the array and the index
    d.colorNumber = constants.HEATMAP_COLOR_VALUES[Math.floor((index / sortedDataAverage.length) * constants.HEATMAP_COLOR_VALUES.length)];
  });

  const heatMapColors = sortedDataAverage.map(({ colorNumber }) => {
    sortedDataAverage.length === 1 ? (colorNumber = 1) : colorNumber;
    return d3.interpolateRdYlGn(colorNumber);
  });

  // create an object with the month as key and the color as value
  const heatMapColor = sortedDataAverage.reduce((acc, curr, index) => {
    acc[curr.month] = heatMapColors[index];
    return acc;
  }, {});

  if (dataName === 'PAR.csv') {
    tableHead.innerHTML = renderTableHeader({ labels: constants.PAR_LABELS });
    data.forEach((d) => {
      tableBody.innerHTML += renderTableRow({ row: d, heatMapColor, sortedData: sortedDataAverage });
    });
    return;
  }

  if (dataName === 'SOLAR.csv') {
    tableHead.innerHTML = renderTableHeader({ labels: constants.SOLAR_LABELS });

    data.forEach((d) => {
      tableBody.innerHTML += renderTableRow({ row: d, heatMapColor, sortedData: sortedDataAverage });
    });
    return;
  }
};

function generateChart({ data, filteredData, field, dataName = 'PAR.csv' }) {
  const margin = { top: 50, right: 50, bottom: 30, left: 70 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // create a container for the chart
  const chartContainer = document.createElement('div');
  chartContainer.classList.add('chart-container');
  chartContainer.id = `${field}-chart-container`;
  document.getElementById('chart').appendChild(chartContainer);

  // append the svg object to the body of the page
  const svg = d3
    .select(`#${field}-chart-container`)
    .append('svg')
    .attr('id', `${field}-chart`)
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    // mobile responsive
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Add X axis --> it is a month format
  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => +d.monthNumber))
    .range([0, width]);
  svg
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .attr('opacity', 0.5)
    .call(
      d3
        .axisBottom(x)
        .ticks(12)
        .tickFormat((d) => {
          return constants.MONTHS[d];
        })
    );

  // Add Y axis
  const y0 = d3
    .scaleLinear()
    .domain([0, d3.max(filteredData, (d) => +d[field])])
    .range([height, 0]);
  svg.append('g').attr('opacity', 0.5).call(d3.axisLeft(y0));

  // Add the area
  svg
    .append('path')
    .datum(filteredData)
    .attr('fill', '#3366ff')
    .attr('stroke', '#3366ff')
    .attr('stroke-width', 1.5)
    .attr('fill-opacity', 0.3)
    .attr(
      'd',
      d3
        .area()
        .x((d) => x(d.monthNumber))
        .y0(y0(0))
        .y1((d) => y0(d[field]))
    );

  const tooltip = d3.select('#tooltip');
  const mouseover = (event, d) => {
    tooltip
      .style('opacity', 1)
      .style('display', 'block')
      .style('left', event.pageX + 10 + 'px')
      .style('top', event.pageY - 30 + 'px')
      .html(`<b>${getRightLabel({ dataName, field })}:</b> ${d[field]}`);
  };
  const mousemove = (event, d) => {
    tooltip
      .style('position', 'absolute')
      .style('left', event.pageX + 10 + 'px')
      .style('top', event.pageY - 30 + 'px');
  };

  const mouseleave = (event, d) => {
    tooltip.style('opacity', 0).style('display', 'none').style('left', 0).style('top', 0).html('');
  };

  // Add the grids
  svg
    .append('g')
    .data(filteredData)
    .attr('class', 'grid')
    .attr('transform', `translate(0,${height})`)
    .attr('opacity', 0.2)
    .attr('stroke-width', 0.5)
    .call(d3.axisBottom().scale(x).tickSize(-height, 0, 0).tickFormat(''));

  svg
    .append('g')
    .attr('class', 'grid')
    .attr('opacity', 0.2)
    .attr('stroke-width', 0.5)
    .call(
      d3
        .axisLeft()
        .scale(y0)
        .tickSize(-width + 2, 0, 0)
        .tickFormat('')
    );
  // Add the points
  svg
    .append('g')
    .selectAll('dot')
    .data(filteredData)
    .enter()
    .append('circle')
    .attr('cx', (d) => x(d.monthNumber))
    .attr('cy', (d) => y0(d[field]))
    .attr('r', 5)
    .attr('fill', '#3366ff')
    .on('mouseover', mouseover)
    .on('mousemove', mousemove)
    .on('mouseleave', mouseleave);

  // Add a title at the top of the chart
  svg
    .append('text')
    .attr('x', width / 2)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .text(`${getRightLabel({ dataName, field })} en ${filteredData[0].town} - ${filteredData[0].station} - ${filteredData[0].year}`);

  // Add a button to download the chart adding to the DOM
  const downloadButton = document.createElement('button');
  downloadButton.innerHTML = 'Descargar';
  downloadButton.classList.add('button');
  downloadButton.classList.add('download-button');
  downloadButton.addEventListener('click', () => {
    downloadSvgAsPng({ svgId: `${field}-chart`, fileName: `${field}-chart` });
  });
  document.getElementById(`${field}-chart-container`).appendChild(downloadButton);
}

function openModal({ town }) {
  const modal = document.querySelector('.modal-overlay');
  const body = document.querySelector('body');
  body.style.overflow = 'hidden';
  modal.style.display = 'block';
  renderCharts({ town, fromMap: true });
}

async function renderCharts({ town, fromMap, fromChangeFileName, fromYearFilter }) {
  const dataFileNameField = document.getElementById('data-file-name-filter');
  const townFilterField = document.getElementById('town-filter');
  const yearFilterField = document.getElementById('year-filter');
  const stationFilterField = document.getElementById('station-filter');
  if (fromMap) townFilterField.value = town;
  townFilterField.disabled = true;

  const SolarData = await d3.csv('./assets/SOLAR.csv', (d) => {
    if (d.Municipio !== townFilterField.value) return;
    return Object.keys(d).reduce((acc, key) => {
      const newKey = constants.SOLAR_HEADER_KEYS[key];
      if (newKey) {
        acc[newKey] = d[key];
      }
      return acc;
    }, {});
  });
  const ParData = await d3.csv('./assets/PAR.csv', (d) => {
    if (d.Municipio !== townFilterField.value) return;
    return Object.keys(d).reduce((acc, key) => {
      const newKey = constants.PAR_HEADER_KEYS[key];
      if (newKey) {
        acc[newKey] = d[key];
      }
      return acc;
    }, {});
  });

  if (fromMap) {
    const dataFileNameFieldOptions = [];

    if (ParData.length > 0) {
      dataFileNameFieldOptions.push({ value: 'PAR.csv', label: 'PAR' });
    }
    if (SolarData.length > 0) {
      dataFileNameFieldOptions.push({ value: 'SOLAR.csv', label: 'SOLAR' });
    }

    setFieldOptions({ fieldId: 'data-file-name-filter', options: dataFileNameFieldOptions });
    dataFileNameField.value = 'PAR.csv';
  }

  if (fromChangeFileName) {
    yearFilterField.value = '';
    stationFilterField.value = '';
  }

  if (fromYearFilter) {
    stationFilterField.value = '';
  }

  const selectedYear = yearFilterField.value;
  const selectedStation = stationFilterField.value;

  const data = dataFileNameField.value === 'PAR.csv' ? ParData : SolarData;

  const years = new Set(data.map((d) => +d.year));
  const yearOptions = Array.from(years).map((year) => ({ value: year, label: year }));
  if (!selectedYear || fromChangeFileName) setFieldOptions({ fieldId: 'year-filter', options: yearOptions });

  const stations = new Set(data.map((d) => d.station));
  const stationOptions = Array.from(stations).map((station) => ({ value: station, label: station }));
  if (!selectedStation || fromChangeFileName || fromYearFilter) setFieldOptions({ fieldId: 'station-filter', options: stationOptions });

  const minYear = d3.min(data, (d) => +d.year);

  const yearFilter = selectedYear || minYear;
  const stationFilter = selectedStation || data[0].station;

  yearFilterField.value = yearFilter;
  stationFilterField.value = stationFilter;

  const filteredData = data.filter((d) => +d.year === +yearFilter && d.station === stationFilter);

  d3.select('#chart').selectAll('*').remove();

  // Render data
  renderTable({ data: filteredData, dataName: dataFileNameField.value });
  dataFileNameField.value === 'PAR.csv'
    ? Object.keys(constants.PAR_LABELS).forEach((label) => {
        generateChart({ data, filteredData, field: label, dataName: dataFileNameField.value });
      })
    : Object.keys(constants.SOLAR_LABELS).forEach((label) => {
        generateChart({ data, filteredData, field: label, dataName: dataFileNameField.value });
      });
}
