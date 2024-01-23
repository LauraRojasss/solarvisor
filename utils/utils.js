// Filters
const setFieldOptions = ({ fieldId, options }) => {
  const field = document.getElementById(fieldId);
  field.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.text = 'Seleccione un campo';
  defaultOption.selected = true;
  defaultOption.hidden = true;
  field.appendChild(defaultOption);
  options.forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.text = option.label;
    field.appendChild(optionElement);
  });
};

const clearFieldOptions = ({ fieldId }) => {
  const field = document.getElementById(fieldId);
  field.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.text = 'Seleccione un campo';
  defaultOption.selected = true;
  defaultOption.hidden = true;
  field.appendChild(defaultOption);
};

// Charts
getRightLabel = ({ dataName, field }) => {
  return dataName === 'PAR.csv' ? constants.PAR_LABELS[field] : constants.SOLAR_LABELS[field];
};

// Download SVG Chart
const downloadSvgAsPng = ({ svgId, fileName }) => {
  const svg = document.getElementById(svgId);
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const svgSize = svg.getBoundingClientRect();
  canvas.width = svgSize.width;
  canvas.height = svgSize.height;
  const ctx = canvas.getContext('2d');
  // set a background color for svg
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = document.createElement('img');
  img.setAttribute('src', 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData))));
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    const a = document.createElement('a');
    a.download = `${fileName}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };
};

// Table Chart
const renderTableRow = ({ row, heatMapColor, sortedData }) => {
  const firstSortedAverageItem = row.averageSolar ? sortedData[0].solar : sortedData[0].par;
  const lastSortedAverageItem = row.averageSolar ? sortedData[sortedData.length - 1].solar : sortedData[sortedData.length - 1].par;
  return `<tr>
    <td>${row.month}</td>
      ${Object.keys(row.averageSolar ? constants.SOLAR_LABELS : constants.PAR_LABELS)
        .map((label) => {
          if (label.includes('average')) return;
          return `<td>${row[label]}</td>`;
        })
        .join('')}
        ${
          row.averageSolar
            ? `<td>
                <div 
                  style="background-color: ${heatMapColor[row.month]}; 
                  font-weight: 700; 
                  color: ${row.averageSolar === firstSortedAverageItem || row.averageSolar === lastSortedAverageItem ? 'var(--white)' : '#000'}"
                  >
                  ${row.averageSolar}
                </div>
              </td>`
            : `<td>
              <div 
                style="background-color: ${heatMapColor[row.month]}; 
                font-weight: 700; 
                color: ${row.averagePar === firstSortedAverageItem || row.averagePar === lastSortedAverageItem ? 'var(--white)' : '#000'}"
                >
                ${row.averagePar}
              </div>
            </td>`
        }
  </tr>`;
};

const renderTableHeader = ({ labels }) => {
  const tooltipContent = 'Test';
  return `<tr>
    <th>Mes</th>
    ${Object.keys(labels)
      .map((label) => {
        if (label.includes('average')) return;
        return `<th>${labels[label]}</th>`;
      })
      .join('')}
      <th class="average-info">
        <img id="average-info-icon" src="assets/circle-info-solid-black.svg" alt="info" onmouseover="renderAverageInfoTooltip(event)" onmouseout="removeAverageInfoTooltip()" onmousemove="updateAverageInforTooltipPosition(event)"/>
        <div>${labels.averageSolar ? constants.SOLAR_LABELS.averageSolar : constants.PAR_LABELS.averagePar}</div>
      </th>
  </tr>`;
};

const renderAverageInfoTooltip = (event) => {
  const tooltip = document.getElementById('tooltip');
  const tooltipContent = 'Test';
  const averageInfoIcon = document.getElementById('average-info-icon');
  tooltip.classList.add('show');
  // set tooltip position based on the mouse position
  tooltip.style.top = `${event.clientY - 50}px`;
  tooltip.style.left = `${event.clientX - 50}px`;
  tooltip.style.display = 'block';
  tooltip.style.opacity = 1;

  tooltip.innerHTML = tooltipContent;
};

const updateAverageInforTooltipPosition = (event) => {
  const tooltip = document.getElementById('tooltip');
  tooltip.style.top = `${event.clientY - 50}px`;
  tooltip.style.left = `${event.clientX - 50}px`;
};

const removeAverageInfoTooltip = () => {
  const tooltip = document.getElementById('tooltip');
  tooltip.classList.remove('show');
  tooltip.style.opacity = 0;
  tooltip.style.display = 'none';
};

