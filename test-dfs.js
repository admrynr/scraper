async function testDFS() {
  const login = 'reyneradam@gmail.com';
  const password = '54682485a73d0988';
  const token = Buffer.from(`${login}:${password}`).toString('base64');
  
  const body = JSON.stringify([
    {
      keyword: "Software House in London",
      location_name: "United Kingdom",
      language_code: "en",
      device: "desktop",
      os: "windows",
      depth: 20,
      search_places: true,
    }
  ]);

  console.log('Fetching...');
  const res = await fetch('https://api.dataforseo.com/v3/serp/google/maps/live/advanced', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json'
    },
    body
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data.tasks?.[0]?.result?.[0]?.items?.slice(0, 1), null, 2));
  console.log('Status:', data.tasks?.[0]?.status_message);
}

testDFS();
