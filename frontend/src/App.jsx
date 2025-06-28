import React, { useRef, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

const App = () => {
  const globeEl = useRef();
  const [asteroids, setAsteroids] = useState([]);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const fetchAsteroids = async () => {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);

      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const res = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=hltqJvHBbUeijYlNu7jgPSBb5vDr1BVQ6hLiCWo7`);
      const data = await res.json();

      if (data.near_earth_objects) {
        const allAsteroids = Object.values(data.near_earth_objects).flat();
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
      } else {
        console.error("Unexpected asteroid response structure:", data);
        setAsteroids([]);
      }
    };

    fetchAsteroids();
  }, []);

  useEffect(() => {
    const globe = globeEl.current;
    if (!globe) return;

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.3;
    globe.camera().position.z = 300;

    const CLOUDS_IMG = '/clouds.png';
    new THREE.TextureLoader().load(CLOUDS_IMG, texture => {
      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(globe.getGlobeRadius() * 1.004, 75, 75),
        new THREE.MeshPhongMaterial({ map: texture, transparent: true })
      );
      globe.scene().add(clouds);

      (function rotateClouds() {
        clouds.rotation.y += -0.006 * Math.PI / 180;
        requestAnimationFrame(rotateClouds);
      })();
    });
  }, []);

  useEffect(() => {
    const globe = globeEl.current;
    if (!globe || asteroids.length === 0) return;

    const scene = globe.scene();
    const asteroidGroup = new THREE.Group();
    asteroidGroup.name = 'asteroidGroup';

    asteroids.forEach(({ lat, lng, hazardous, name, miss_distance_km, velocity_kph }) => {
      const color = hazardous ? 0xff0000 : 0xffff00;
      const geometry = new THREE.SphereGeometry(2.5, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color });
      const sphere = new THREE.Mesh(geometry, material);

      const radius = globe.getGlobeRadius() * 1.7;
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      sphere.position.setFromSphericalCoords(radius, phi, theta);

      sphere.userData = { name, hazardous, miss_distance_km, velocity_kph };
      sphere.callback = (event) => {
        setTooltip({
          x: event.clientX,
          y: event.clientY,
          html: `
            <strong>${name}</strong><br/>
            Hazardous: ${hazardous ? 'Yes' : 'No'}<br/>
            Distance: ${Number(miss_distance_km).toLocaleString()} km<br/>
            Velocity: ${Number(velocity_kph).toLocaleString()} km/h
          `
        });
      };

      asteroidGroup.add(sphere);
    });

    scene.add(asteroidGroup);

    const handleMouseClick = (event) => {
      const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, globe.camera());

      const intersects = raycaster.intersectObjects(asteroidGroup.children);
      if (intersects.length > 0) {
        const intersect = intersects[0].object;
        if (intersect.callback) intersect.callback(event);
      } else {
        setTooltip(null);
      }
    };

    window.addEventListener('click', handleMouseClick);
    return () => {
      window.removeEventListener('click', handleMouseClick);
      scene.remove(scene.getObjectByName('asteroidGroup'));
    };
  }, [asteroids]);

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <h1 style={{
        position: 'absolute',
        top: '20px',
        width: '100%',
        textAlign: 'center',
        color: 'white',
        fontSize: '2rem',
        fontFamily: 'Orbitron, sans-serif',
        zIndex: 5
      }}>Asteroids Near Earth</h1>

      <Globe
        ref={globeEl}
        globeImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
        backgroundColor="black"
      />
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            top: tooltip.y,
            left: tooltip.x,
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '10px',
            borderRadius: '5px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            fontSize: '0.85rem',
            fontFamily: 'sans-serif',
            color: '#000',
            zIndex: 10
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.html }}
        />
      )}
    </div>
  );
};

export default App;
