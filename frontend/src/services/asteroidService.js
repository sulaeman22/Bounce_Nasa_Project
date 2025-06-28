// E:\Earth\frontend\src\services\asteroidService.js
const BASE_URL = 'http://localhost:3000/api';

export async function fetchAsteroids(startDate, endDate) {
  const res = await fetch(`${BASE_URL}/asteroids?start_date=${startDate}&end_date=${endDate}`);
  if (!res.ok) throw new Error('Failed to fetch asteroid data');
  return res.json();
}
