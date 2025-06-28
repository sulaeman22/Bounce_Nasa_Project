app.get('/api/asteroids', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${start_date}&end_date=${end_date}&api_key=${NASA_API_KEY}`;
    const response = await axios.get(url);
    const neoData = response.data.near_earth_objects;

    // Flatten asteroids across all dates
    const allAsteroids = Object.values(neoData).flat();

    const processed = allAsteroids.map((asteroid) => {
      const approach = asteroid.close_approach_data?.[0] || {};
      const lat = Math.random() * 180 - 90;
      const lng = Math.random() * 360 - 180;

      return {
        name: asteroid.name,
        hazardous: asteroid.is_potentially_hazardous_asteroid,
        miss_distance_km: parseFloat(approach?.miss_distance?.kilometers || 0),
        velocity_kph: parseFloat(approach?.relative_velocity?.kilometers_per_hour || 0),
        lat,
        lng
      };
    });

    res.json(processed);
  } catch (err) {
    console.error("Asteroid fetch error:", err.message);
    res.status(500).json({ error: 'Failed to fetch asteroid data' });
  }
});
