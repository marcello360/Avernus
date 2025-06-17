const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';

async function fetchHexes() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/Hexes?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await res.json();
  document.getElementById('output').innerText = JSON.stringify(data, null, 2);
}

fetchHexes();
