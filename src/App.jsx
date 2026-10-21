import { useCallback, useEffect, useState } from 'react';
import './App.css';

const defaultAirports = [
  {
    id: 'hyderabad',
    name: 'Hyderabad Airport',
    shortName: 'HYD',
    latitude: 17.2403,
    longitude: 78.4294,
  },
  {
    id: 'vijayawada',
    name: 'Vijayawada Airport',
    shortName: 'VGA',
    latitude: 16.5304,
    longitude: 80.7968,
  },
  {
    id: 'chennai',
    name: 'Chennai Airport',
    shortName: 'MAA',
    latitude: 12.9941,
    longitude: 80.1709,
  },
];

const initialFlights = [
  {
    id: 'AI 502',
    from: 'Hyderabad',
    to: 'Delhi',
    status: 'Delayed',
    cause: 'Weather monitoring',
    airportId: 'hyderabad',
  },
  {
    id: '6E 214',
    from: 'Chennai',
    to: 'Bengaluru',
    status: 'Monitoring',
    cause: 'Rain monitoring',
    airportId: 'chennai',
  },
  {
    id: 'UK 830',
    from: 'Mumbai',
    to: 'Hyderabad',
    status: 'On Schedule',
    cause: 'Routine monitoring',
    airportId: 'hyderabad',
  },
];

function getWeatherDescription(code) {
  if (code === 0) return 'Clear Sky';
  if ([1, 2, 3].includes(code)) return 'Partly Cloudy';
  if ([45, 48].includes(code)) return 'Fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Clear Sky';
}

function getWeatherIcon(code) {
  if (code === 0) return '☀️';
  if ([1, 2, 3].includes(code)) return '⛅';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55, 56, 57].includes(code)) return '🌦️';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return '☀️';
}

function getSeverity(code, windSpeed) {
  if ([95, 96, 99].includes(code) || windSpeed >= 50) return 'High';

  if (
    [45, 48, 65, 67, 82, 86].includes(code) ||
    windSpeed >= 30
  ) {
    return 'Medium';
  }

  if (
    [51, 53, 55, 56, 57, 61, 63, 66, 71, 73, 75, 77, 80, 81, 85].includes(code) ||
    windSpeed >= 20
  ) {
    return 'Low';
  }

  return null;
}

function createWeatherAlerts(weatherData, currentAirports) {
  const alerts = [];

  currentAirports.forEach((airport, index) => {
    const current = weatherData[index]?.current;
    if (!current) return;

    const code = current.weather_code ?? 0;
    const windSpeed = current.wind_speed_10m ?? 10;
    const severity = getSeverity(code, windSpeed);
    const condition = getWeatherDescription(code);

    if (!severity) return;

    let message = `${condition} conditions detected at ${airport.name}.`;

    if ([95, 96, 99].includes(code)) {
      message = `Thunderstorm risk detected at ${airport.name}. Monitor airport operations.`;
    } else if (windSpeed >= 50) {
      message = `Strong winds (${windSpeed} km/h) detected at ${airport.name}.`;
    }

    alerts.push({
      id: `live-${airport.id}`,
      airportId: airport.id,
      airportName: airport.name,
      airportCode: airport.shortName,
      severity,
      title: `${severity} Weather Alert`,
      message,
      condition,
      windSpeed,
      source: 'Live Weather',
    });
  });

  return alerts;
}

function App() {
  const [airports, setAirports] = useState(() => {
    const saved = localStorage.getItem('skyops_airports');
    return saved ? JSON.parse(saved) : defaultAirports;
  });

  const [flights, setFlights] = useState(initialFlights);
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [weather, setWeather] = useState([]);
  const [liveWeatherAlerts, setLiveWeatherAlerts] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const [newAirportName, setNewAirportName] = useState('');
  const [newAirportCode, setNewAirportCode] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLon, setNewLon] = useState('');

  useEffect(() => {
    localStorage.setItem('skyops_airports', JSON.stringify(airports));
  }, [airports]);

  const fetchWeather = useCallback(async (currentAirports) => {
    if (!currentAirports || currentAirports.length === 0) return;
    setWeatherLoading(true);
    setWeatherError('');

    try {
      const latitude = currentAirports.map((airport) => airport.latitude).join(',');
      const longitude = currentAirports.map((airport) => airport.longitude).join(',');

      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
        `&longitude=${longitude}` +
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
        '&wind_speed_unit=kmh&timezone=auto';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Weather service is temporarily unavailable.');
      }

      const data = await response.json();
      const results = Array.isArray(data) ? data : [data];

      const weatherCards = currentAirports.map((airport, index) => {
        const current = results[index]?.current || {
          temperature_2m: 28,
          apparent_temperature: 30,
          relative_humidity_2m: 65,
          wind_speed_10m: 12,
          weather_code: 0,
        };

        return {
          ...airport,
          temperature: Math.round(current.temperature_2m),
          feelsLike: Math.round(current.apparent_temperature),
          humidity: current.relative_humidity_2m,
          windSpeed: current.wind_speed_10m,
          weatherCode: current.weather_code,
          condition: getWeatherDescription(current.weather_code),
          icon: getWeatherIcon(current.weather_code),
        };
      });

      setWeather(weatherCards);
      const newAlerts = createWeatherAlerts(results, currentAirports);
      setLiveWeatherAlerts(newAlerts);
      setLastUpdated(new Date());

      setFlights((prevFlights) =>
        prevFlights.map((flight) => {
          const hasHighAlert = newAlerts.some(
            (alert) => alert.airportId === flight.airportId && alert.severity === 'High'
          );
          if (hasHighAlert) {
            return { ...flight, status: 'Delayed', cause: 'High Weather Alert' };
          }
          return flight;
        })
      );
    } catch (error) {
      // Fallback data so demo never breaks
      const fallbackCards = currentAirports.map((airport) => ({
        ...airport,
        temperature: 29,
        feelsLike: 32,
        humidity: 60,
        windSpeed: 14,
        weatherCode: 0,
        condition: 'Clear Sky',
        icon: '☀️',
      }));
      setWeather(fallbackCards);
      setLiveWeatherAlerts([]);
      setWeatherError('Network offline. Showing default simulated conditions.');
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(airports);
  }, [fetchWeather, airports]);

  const handleAddAirport = (e) => {
    e.preventDefault();
    if (!newAirportName || !newAirportCode || !newLat || !newLon) return;

    const newObj = {
      id: newAirportName.toLowerCase().replace(/\s+/g, '-'),
      name: newAirportName,
      shortName: newAirportCode.toUpperCase(),
      latitude: parseFloat(newLat),
      longitude: parseFloat(newLon),
    };

    if (airports.some((a) => a.id === newObj.id || a.shortName === newObj.shortName)) {
      alert('Airport already exists!');
      return;
    }

    const updatedAirports = [...airports, newObj];
    setAirports(updatedAirports);

    setNewAirportName('');
    setNewAirportCode('');
    setNewLat('');
    setNewLon('');
  };

  const handleDeleteAirport = (airportId) => {
    const updated = airports.filter((a) => a.id !== airportId);
    setAirports(updated);
  };

  const demoAlerts = [
    {
      id: 'demo-high',
      airportId: 'hyderabad',
      airportName: 'Hyderabad Airport',
      airportCode: 'HYD',
      severity: 'High',
      title: 'Demo High Priority Alert',
      message: 'Demo alert for testing the High severity filter.',
      condition: 'Demo',
      source: 'Demo',
    },
    {
      id: 'demo-medium',
      airportId: 'chennai',
      airportName: 'Chennai Airport',
      airportCode: 'MAA',
      severity: 'Medium',
      title: 'Demo Medium Priority Alert',
      message: 'Demo alert for testing the Medium severity filter.',
      condition: 'Demo',
      source: 'Demo',
    },
  ];

  const allAlerts = [...liveWeatherAlerts, ...demoAlerts];

  const filteredAlerts =
    selectedSeverity === 'All'
      ? allAlerts
      : allAlerts.filter((alert) => alert.severity === selectedSeverity);

  function getFlightWeatherImpact(flight) {
    const airport = airports.find((item) => item.id === flight.airportId);
    const matchedAlerts = liveWeatherAlerts.filter(
      (alert) => alert.airportId === flight.airportId
    );

    if (matchedAlerts.some((alert) => alert.severity === 'High')) {
      return { label: 'High Risk', severity: 'high' };
    }

    if (matchedAlerts.some((alert) => alert.severity === 'Medium')) {
      return { label: 'Medium Risk', severity: 'medium' };
    }

    if (matchedAlerts.some((alert) => alert.severity === 'Low')) {
      return { label: 'Low Risk', severity: 'low' };
    }

    return {
      label: airport ? `No Alert · ${airport.shortName}` : 'No Alert',
      severity: 'normal',
    };
  }

  function openAlertDetails(alert) {
    setSelectedAlert(alert);
  }

  const highAlerts = liveWeatherAlerts.filter(
    (alert) => alert.severity === 'High'
  ).length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">✈</span>
          <div>
            <h1>SkyOps</h1>
            <p>Airport Operations Coordination Engine</p>
          </div>
        </div>

        <div className="topbar-right">
          <span className="live-indicator">
            <span className="live-dot" />
            Weather Monitoring
          </span>
          <button
            className="refresh-button"
            onClick={() => fetchWeather(airports)}
            disabled={weatherLoading}
          >
            {weatherLoading ? '⟳ Refreshing...' : '↻ Refresh Weather'}
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="welcome-section">
          <div>
            <p className="eyebrow">OPERATIONS OVERVIEW</p>
            <h2>Airport Operations Dashboard</h2>
            <p className="subtitle">
              Monitor airport weather conditions and their potential operational impact.
            </p>
          </div>
          <div className="updated-time">
            <span>Last updated</span>
            <strong>
              {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Waiting for data'}
            </strong>
          </div>
        </section>

        {weatherError && (
          <div className="error-message">
            <strong>Notice:</strong> {weatherError}
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon blue">✈</span>
            <div>
              <p>Flights Monitored</p>
              <h3>{flights.length}</h3>
              <span className="stat-note">Sample flight records</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon red">⚠</span>
            <div>
              <p>High Weather Alerts</p>
              <h3>{highAlerts}</h3>
              <span className="stat-note">Based on live weather</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon green">◉</span>
            <div>
              <p>Airports Monitored</p>
              <h3>{airports.length}</h3>
              <span className="stat-note">Weather API connected</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon orange">↻</span>
            <div>
              <p>Flights Mapped</p>
              <h3>{flights.length}</h3>
              <span className="stat-note">Linked to airport weather</span>
            </div>
          </div>
        </section>

        <section className="section" style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div className="section-heading" style={{ marginBottom: '12px' }}>
            <div>
              <p className="eyebrow">CONFIGURATION</p>
              <h2>Add Airport for Monitoring</h2>
            </div>
          </div>
          <form onSubmit={handleAddAirport} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Airport Name</label>
              <input type="text" placeholder="e.g. Bengaluru Airport" value={newAirportName} onChange={(e) => setNewAirportName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>IATA Code</label>
              <input type="text" placeholder="e.g. BLR" value={newAirportCode} onChange={(e) => setNewAirportCode(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Latitude</label>
              <input type="number" step="any" placeholder="e.g. 12.9716" value={newLat} onChange={(e) => setNewLat(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Longitude</label>
              <input type="number" step="any" placeholder="e.g. 77.5946" value={newLon} onChange={(e) => setNewLon(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
            </div>
            <button type="submit" className="refresh-button" style={{ height: '38px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
              + Add Airport
            </button>
          </form>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">LIVE CONDITIONS</p>
              <h2>Airport Weather</h2>
            </div>
            <span className="section-meta">
              {weatherLoading ? 'Updating weather...' : 'Powered by Open-Meteo'}
            </span>
          </div>

          <div className="weather-grid">
            {weather.length > 0
              ? weather.map((airport) => (
                  <article className="weather-card" key={airport.id}>
                    <button
                      className="delete-card-btn"
                      onClick={() => handleDeleteAirport(airport.id)}
                      title="Remove Airport"
                    >
                      ×
                    </button>
                    <div className="weather-card-top">
                      <div>
                        <p className="airport-code">{airport.shortName}</p>
                        <h3>{airport.name}</h3>
                      </div>
                      <span className="weather-icon">{airport.icon}</span>
                    </div>

                    <div className="temperature-row">
                      <h2>{airport.temperature}°C</h2>
                      <span>{airport.condition}</span>
                    </div>

                    <div className="weather-details">
                      <div>
                        <span>Feels like</span>
                        <strong>{airport.feelsLike}°C</strong>
                      </div>
                      <div>
                        <span>Humidity</span>
                        <strong>{airport.humidity}%</strong>
                      </div>
                      <div>
                        <span>Wind</span>
                        <strong>{airport.windSpeed} km/h</strong>
                      </div>
                    </div>
                  </article>
                ))
              : airports.map((airport) => (
                  <article className="weather-card" key={airport.id}>
                    <div className="weather-card-top">
                      <div>
                        <p className="airport-code">{airport.shortName}</p>
                        <h3>{airport.name}</h3>
                      </div>
                      <span className="weather-icon">☀️</span>
                    </div>
                    <div className="temperature-row">
                      <h2>{weatherLoading ? '...' : '29°C'}</h2>
                      <span>Clear Sky</span>
                    </div>
                  </article>
                ))}
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AUTOMATED MONITORING</p>
              <h2>Weather Alerts</h2>
            </div>
            <span className="alert-count">{filteredAlerts.length} alerts</span>
          </div>

          <div className="severity-filters">
            {['All', 'High', 'Medium', 'Low'].map((severity) => (
              <button
                key={severity}
                className={`filter-button ${
                  selectedSeverity === severity ? 'active' : ''
                }`}
                onClick={() => setSelectedSeverity(severity)}
              >
                {severity}
              </button>
            ))}
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="empty-state">
              <span>✓</span>
              <h3>No alerts found for this severity</h3>
              <p>Try another filter or refresh the latest airport weather.</p>
            </div>
          ) : (
            <div className="alerts-list">
              {filteredAlerts.map((alert) => (
                <article
                  className={`alert-card severity-${alert.severity.toLowerCase()}`}
                  key={alert.id}
                >
                  <div className="alert-symbol">⚠</div>
                  <div className="alert-content">
                    <div className="alert-title-row">
                      <h3>{alert.title}</h3>
                      <span
                        className={`severity-badge ${alert.severity.toLowerCase()}`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p>{alert.message}</p>
                    <div className="alert-meta">
                      <span>📍 {alert.airportCode} · {alert.airportName}</span>
                      <span>Source: {alert.source}</span>
                    </div>
                  </div>
                  <button
                    className="details-button"
                    onClick={() => openAlertDetails(alert)}
                  >
                    View Details
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">OPERATIONAL COORDINATION</p>
              <h2>Flight Operations</h2>
            </div>
            <span className="section-meta">Airport weather mapping</span>
          </div>

          <div className="table-note">
            Flight routes and statuses below are sample records. Weather impact
            is calculated from the latest weather alerts for each mapped airport;
            this is not a live airline flight feed.
          </div>

          <div className="table-container">
            <table className="flights-table">
              <thead>
                <tr>
                  <th>Flight</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>Mapped Airport</th>
                  <th>Weather Impact</th>
                  <th>Cause</th>
                </tr>
              </thead>
              <tbody>
                {flights.map((flight) => {
                  const airport = airports.find(
                    (item) => item.id === flight.airportId
                  );
                  const impact = getFlightWeatherImpact(flight);

                  return (
                    <tr key={flight.id}>
                      <td>
                        <strong>{flight.id}</strong>
                      </td>
                      <td>{flight.from} → {flight.to}</td>
                      <td>
                        <span
                          className={`flight-status ${flight.status
                            .toLowerCase()
                            .replaceAll(' ', '-')}`}
                        >
                          {flight.status}
                        </span>
                      </td>
                      <td>
                        <strong>{airport?.shortName ?? 'N/A'}</strong>
                        <span className="airport-cell-name">
                          {airport?.name ?? 'Unknown airport'}
                        </span>
                      </td>
                      <td>
                        <span className={`impact-badge ${impact.severity}`}>
                          {impact.label}
                        </span>
                      </td>
                      <td>{flight.cause}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="dashboard-footer">
          <p>SkyOps · Airport Operations Coordination Engine</p>
          <p>Weather data: Open-Meteo API · Flight records: Demo data</p>
        </footer>
      </main>

      {selectedAlert && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedAlert(null)}
          role="presentation"
        >
          <section
            className="details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">ALERT INFORMATION</p>
                <h2 id="alert-details-title">{selectedAlert.title}</h2>
              </div>
              <button
                className="modal-close"
                onClick={() => setSelectedAlert(null)}
                aria-label="Close alert details"
              >
                ×
              </button>
            </div>

            <span
              className={`severity-badge ${selectedAlert.severity.toLowerCase()}`}
            >
              {selectedAlert.severity} Priority
            </span>

            <p className="modal-message">{selectedAlert.message}</p>

            <div className="modal-info-grid">
              <div>
                <span>Airport</span>
                <strong>{selectedAlert.airportName}</strong>
              </div>
              <div>
                <span>Airport Code</span>
                <strong>{selectedAlert.airportCode}</strong>
              </div>
              <div>
                <span>Weather Condition</span>
                <strong>{selectedAlert.condition}</strong>
              </div>
              <div>
                <span>Data Source</span>
                <strong>{selectedAlert.source}</strong>
              </div>
              {selectedAlert.windSpeed !== undefined && (
                <div>
                  <span>Wind Speed</span>
                  <strong>{selectedAlert.windSpeed} km/h</strong>
                </div>
              )}
            </div>

            <div className="affected-flights">
              <h3>Mapped Sample Flights</h3>
              {flights.filter(
                (flight) => flight.airportId === selectedAlert.airportId
              ).length > 0 ? (
                flights
                  .filter(
                    (flight) => flight.airportId === selectedAlert.airportId
                  )
                  .map((flight) => (
                    <div className="affected-flight-row" key={flight.id}>
                      <strong>{flight.id}</strong>
                      <span>{flight.from} → {flight.to}</span>
                    </div>
                  ))
              ) : (
                <p>No sample flights are mapped to this airport.</p>
              )}
            </div>

            <p className="modal-disclaimer">
              This alert is an automated weather indicator, not an official
              aviation warning. Confirm operational decisions with authorized
              airport and aviation sources.
            </p>

            <button
              className="refresh-button modal-done"
              onClick={() => setSelectedAlert(null)}
            >
              Close Details
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;