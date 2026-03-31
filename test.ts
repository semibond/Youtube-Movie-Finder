import ytsr from 'ytsr';

async function test() {
  try {
    const searchResults = await ytsr('kemal sunal', { limit: 2 });
    console.log(JSON.stringify(searchResults.items, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
