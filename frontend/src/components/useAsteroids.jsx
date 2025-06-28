import { useEffect, useState } from 'react';
import { fetchAsteroids } from '../services/asteroidService';

const useAsteroids = () => {
  const [asteroids, setAsteroids] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split('T')[0];

      try {
        const rawData = await fetchAsteroids(today, today); // Call backend
        const allAsteroids = Array.isArray(rawData)
          ? rawData
          : Object.values(rawData.near_earth_objects || {}).flat();

        const processed = allAsteroids.map((asteroid) => {
          const approach = asteroid.close_approach_data?.[0] || {};
          const missDistanceLD = parseFloat(approach?.miss_distance?.lunar || 0);
          const velocityKMS = parseFloat(approach?.relative_velocity?.kilometers_per_second || 0);

          const lat = Math.random() * 180 - 90;
          const lng = Math.random() * 360 - 180;

          return {
            name: asteroid.name,
            hazardous: asteroid.is_potentially_hazardous_asteroid,
            lat,
            lng,
            miss_distance_km: (missDistanceLD * 384400).toFixed(0),
            velocity_kph: (velocityKMS * 3600).toFixed(0)
          };
        });

        setAsteroids(processed);
      } catch (err) {
        console.error('Failed to fetch asteroid data', err);
      }
    };

    fetchData();
  }, []);

  return asteroids;
};

export default useAsteroids;
