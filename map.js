(function () {
  let map = L.map('map').setView([2.6364671635474878, -75.46158453398657], 7.5);
  // Agregar capa en formato GeoJson
  const customFillColor = {
    VILLAVIEJA: {
      fillColor: '#FFCF00',
    },
    CAMPOALEGRE: {
      fillColor: '#FFCF00',
    },
    RIVERA: {
      fillColor: '#FFCF00',
    },
    AIPE: {
      fillColor: '#FFCF00',
    },
    PALESTINA: {
      fillColor: '#FFCF00',
    },
    ISNOS: {
      fillColor: '#FFCF00',
    },
    GARZÓN: {
      fillColor: '#FFCF00',
    },
  };

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  let carto_light = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '©OpenStreetMap, ©CartoDB',
    subdomains: 'abcd',
    maxZoom: 24,
  });

  let minimap = new L.Control.MiniMap(carto_light, {
    toggleDisplay: true,
    minimized: false,
    position: 'bottomleft',
  }).addTo(map);

  L.control.scale({ imperial: false }).addTo(map);

  let currentMarker = null;

  const renderButton = (town) => {
    if (Object.keys(customFillColor).includes(town))
      return `<button type='button' class='button' id='generate-button' onclick='openModal({town: "${town}"})' class='popup-button'>Generar</button>`;
    return '';
  };
  async function popup(feature, layer) {
    const SolarData = await d3.csv('./assets/SOLAR.csv', (d) => {
      if (d.Municipio !== feature?.properties?.MUNICIPIO) return;
      return Object.keys(d).reduce((acc, key) => {
        const newKey = constants.SOLAR_HEADER_KEYS[key];
        if (newKey) {
          acc[newKey] = d[key];
        }
        return acc;
      }, {});
    });
    const ParData = await d3.csv('./assets/PAR.csv', (d) => {
      if (d.Municipio !== feature?.properties?.MUNICIPIO) return;
      return Object.keys(d).reduce((acc, key) => {
        const newKey = constants.PAR_HEADER_KEYS[key];
        if (newKey) {
          acc[newKey] = d[key];
        }
        return acc;
      }, {});
    });

    const stations = new Set([...SolarData.map((d) => d.station), ...ParData.map((d) => d.station)]);
    const minYear = d3.min([...SolarData, ...ParData], (d) => +d.year);
    const maxYear = d3.max([...SolarData, ...ParData], (d) => +d.year);
    const minMonth = d3.min([...SolarData, ...ParData], (d) => d.month);
    const maxMonth = d3.max([...SolarData, ...ParData], (d) => d.month);

    if (feature?.properties?.MUNICIPIO) {
      const dinamicPopupData =
        feature.properties.MUNICIPIO in customFillColor
          ? `
          <strong>Estaciones: </strong>
          ${Array.from(stations).join(', ')}
          <strong>Fecha Primer Dato: </strong>
          ${minMonth} ${minYear}
          <strong>Fecha Último Dato: </strong>
          ${maxMonth} ${maxYear}
          <strong>Variables: </strong>
          ${SolarData.length > 0 ? 'SOLAR' : ''} ${SolarData.length > 0 && ParData.length > 0 ? 'y' : ''} ${ParData.length > 0 ? 'PAR' : ''}
        `
          : '';
      let popupContent = `<div class='popup-content'>
        <strong>Municipio: </strong>
        ${feature.properties.MUNICIPIO}
        ${dinamicPopupData}
        <div style="margin-bottom: 10px"> </div>
        ${renderButton(feature.properties.MUNICIPIO)}
        </div>`;
      layer.bindPopup(popupContent);

      // render the popup on hover
      layer.on('mouseover', function (e) {
        // Check if the popup has a button (Generate button)
        if (popupContent.includes('button')) {
          layer.openPopup();
        }
        // remove the marker if exists
        if (currentMarker) {
          map.removeLayer(currentMarker);
        }
      });

      // Agregar evento de clic al polígono
      layer.on('click', function (e) {
        // Eliminar el marcador actual si existe
        if (currentMarker) {
          map.removeLayer(currentMarker);
        }

        // Crear un nuevo marcador
        let marker = L.marker(layer.getBounds().getCenter()).addTo(map);
        marker.bindPopup('<strong>Municipio: </strong>' + feature.properties.MUNICIPIO + '<br/>' + '<strong>ID Municipio: </strong>' + feature.properties.OBJECTID_12);

        // Almacenar el marcador actual
        currentMarker = marker;
      });
    }
  }

  L.geoJson(municipios, {
    onEachFeature: popup,
    style: (feature) => {
      return {
        ...customFillColor[feature.properties.MUNICIPIO],
        ...{
          weight: 2,
          color: '#006208',
          fillOpacity: 0.6,
        },
      };
    },
  }).addTo(map);

  // set close modal button event
  const modalClose = document.querySelector('#modal-close');
  modalClose.addEventListener('click', () => {
    const townFilterField = document.getElementById('town-filter');
    const yearFilterField = document.getElementById('year-filter');
    const stationFilterField = document.getElementById('station-filter');
    const modal = document.querySelector('.modal-overlay');
    const body = document.querySelector('body');
    body.style.overflow = 'auto';
    modal.style.display = 'none';
    townFilterField.value = '';
    yearFilterField.value = '';
    stationFilterField.value = '';
    d3.select('#chart').selectAll('*').remove();
  });
  const dataFileNameField = document.getElementById('data-file-name-filter');
  const yearFilterField = document.getElementById('year-filter');
  const stationFilterField = document.getElementById('station-filter');
  const townFilterField = document.getElementById('town-filter');
  dataFileNameField.addEventListener('change', () => {
    renderCharts({ town: townFilterField.value, fromChangeFileName: true });
  });

  // set change year event
  yearFilterField.addEventListener('change', () => {
    renderCharts({ town: townFilterField.value, fromYearFilter: true });
  });

  // set change station event
  stationFilterField.addEventListener('change', () => {
    renderCharts({ town: townFilterField.value });
  });
})();
