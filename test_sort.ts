import ytsr from 'ytsr';

async function test() {
  try {
    const searchResults = await ytsr('https://www.youtube.com/results?search_query=kemal+sunal&sp=CAI%3D', { limit: 5, gl: 'TR', hl: 'tr' } as any);
    const videos = searchResults.items.filter((i: any) => i.type === 'video');
    console.log(JSON.stringify(videos.map((v: any) => ({ title: v.title, uploadedAt: v.uploadedAt })), null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
